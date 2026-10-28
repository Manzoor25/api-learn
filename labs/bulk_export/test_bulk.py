import gzip
import json
import time

from fastapi.testclient import TestClient

from labs.bulk_export.server import create_app, sign


def test_poll_then_download_gzip():
    client = TestClient(create_app())
    started = client.post("/export").json()
    print(f"[export] started {started}", flush=True)
    status = client.get(f"/export/{started['job_id']}").json()
    assert status["state"] == "JobComplete"
    exp = int(status["download"].split("exp=")[1].split("&")[0])
    token = status["download"].split("token=")[1]
    downloaded = client.get(f"/export/{started['job_id']}/download", params={"exp": exp, "token": token})
    assert downloaded.status_code == 200
    lines = gzip.decompress(downloaded.content).decode().splitlines()
    assert [json.loads(line)["id"] for line in lines] == list(range(1, 9))


def test_expired_url_is_refreshed_by_the_job_not_by_the_client():
    client = TestClient(create_app(ttl_s=-1))
    client.post("/export")
    status = client.get("/export/job1").json()
    exp = int(status["download"].split("exp=")[1].split("&")[0])
    token = status["download"].split("token=")[1]
    denied = client.get("/export/job1/download", params={"exp": exp, "token": token})
    assert denied.status_code == 403
    assert denied.json()["detail"] == "signed url expired"
    forged = client.get("/export/job1/download", params={"exp": int(time.time()) + 30, "token": sign("job1", int(time.time()) + 30)})
    assert forged.status_code == 403
    refreshed = client.post("/export/job1/refresh").json()
    ok = client.get("/export/job1/download", params={"exp": refreshed["exp"], "token": refreshed["token"]})
    assert ok.status_code == 200
    assert gzip.decompress(ok.content)
