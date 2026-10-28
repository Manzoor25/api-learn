"""Write a file only the loader should trust after a done marker exists."""

from __future__ import annotations

from pathlib import Path


def publish(directory: Path, name: str, content: str) -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    temporary = directory / f"{name}.tmp"
    temporary.write_text(content, encoding="utf-8")
    final = directory / name
    temporary.replace(final)
    (directory / f"{name}.done").write_text("ok", encoding="utf-8")
    print(f"[file] published {name}", flush=True)
    return final


def leave_partial(directory: Path, name: str, content: str) -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / name
    path.write_text(content, encoding="utf-8")
    print(f"[file] partial {name} has no done marker", flush=True)
    return path


def ready_files(directory: Path) -> list[Path]:
    ready = []
    for path in sorted(directory.glob("*")):
        if path.suffix == ".tmp" or path.name.endswith(".done"):
            continue
        if (directory / f"{path.name}.done").exists():
            ready.append(path)
    return ready


def load_ready(directory: Path) -> list[str]:
    rows = []
    for path in ready_files(directory):
        rows.extend(line for line in path.read_text(encoding="utf-8").splitlines() if line)
    return rows
