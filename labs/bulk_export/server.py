"""Job, poll, gzipped download, expiring signed URL."""

from __future__ import annotations

import gzip
import hashlib
import hmac
import json
import time

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response

SECRET = "export-lab"


def sign(job_id: str, exp: int) -> str:
    return hmac.new(SECRET.encode(), f"{job_id}.{exp}".encode(), hashlib.sha256).hexdigest()[:24]


def create_app(rows: list[dict] | None = None, ttl_s: int = 60) -> FastAPI:
    data = rows or [{"id": i, "amount": i * 10} for i in range(1, 9)]
    jobs: dict[str, dict] = {}
    app = FastAPI()

    @app.post("/export")
    def start() -> dict:
        job_id = "job1"
        exp = int(time.time()) + ttl_s
        jobs[job_id] = {"state": "JobComplete", "exp": exp, "token": sign(job_id, exp)}
        return {"job_id": job_id, "state": "running"}

    @app.get("/export/{job_id}")
    def status(job_id: str) -> dict:
        job = jobs[job_id]
        return {
            "job_id": job_id,
            "state": job["state"],
            "download": f"/export/{job_id}/download?exp={job['exp']}&token={job['token']}",
        }

    @app.get("/export/{job_id}/download")
    def download(job_id: str, exp: int, token: str):
        job = jobs.get(job_id)
        if job is None or exp != job["exp"] or not hmac.compare_digest(job["token"], token):
            raise HTTPException(status_code=403, detail="bad signature")
        if int(time.time()) > job["exp"]:
            raise HTTPException(status_code=403, detail="signed url expired")
        raw = "".join(json.dumps(row) + "\n" for row in data).encode()
        return Response(content=gzip.compress(raw), media_type="application/gzip")

    @app.post("/export/{job_id}/refresh")
    def refresh(job_id: str) -> dict:
        """The only legal way to replace an expired URL. Clients cannot mint one."""
        if job_id not in jobs:
            raise HTTPException(status_code=404, detail="unknown job")
        exp = int(time.time()) + 60
        jobs[job_id]["exp"] = exp
        jobs[job_id]["token"] = sign(job_id, exp)
        return {"exp": exp, "token": jobs[job_id]["token"]}

    return app


def refresh_url(job: dict) -> tuple[int, str]:
    """What a client should do when the old URL 403s: ask for a new expiry."""
    exp = int(time.time()) + 60
    return exp, sign(job["job_id"] if "job_id" in job else "job1", exp)
