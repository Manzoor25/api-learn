"""Generate the static site and Mermaid docs from the module specs."""

from __future__ import annotations

import json
from pathlib import Path

from helpers import nodes  # noqa: F401  (keeps the helper importable for checks)
from part_concepts import CONCEPTS
from part_families import FAMILIES
from part_push import PUSH

ROOT = Path(__file__).resolve().parents[1]
MODULES = FAMILIES + PUSH + CONCEPTS


def mermaid(diagram: dict) -> str:
    kind = diagram["type"]
    if kind == "sequence":
        lines = ["sequenceDiagram"]
        actors = diagram["actors"]
        for actor in actors:
            lines.append(f"  participant {actor.replace(' ', '')} as {actor}")
        for item in diagram["steps"]:
            left = actors[item["from"]].replace(" ", "")
            right = actors[item["to"]].replace(" ", "")
            lines.append(f"  {left}->>{right}: {item['label']}")
        return "\n".join(lines)
    if kind == "state":
        lines = ["stateDiagram-v2"]
        states = diagram["states"]
        for left, right in zip(states, states[1:]):
            lines.append(f"  {left} --> {right}")
        return "\n".join(lines)
    if kind == "race":
        lines = ["flowchart LR"]
        for lane in diagram["lanes"]:
            safe = "".join(ch for ch in lane["name"] if ch.isalnum())
            lines.append(f"  {safe}[{lane['name']}: model {lane['seconds']} units]")
        return "\n".join(lines)
    lines = ["flowchart LR"]
    seen = []
    for node in diagram.get("nodes", []):
        safe = node["id"]
        lines.append(f"  {safe}[{node['label']}]")
        seen.append(safe)
    for left, right in zip(seen, seen[1:]):
        lines.append(f"  {left} --> {right}")
    return "\n".join(lines)


def write_markdown(mod: dict) -> None:
    path = ROOT / "docs" / f"{mod['id']}.md"
    parts = [
        f"# {mod['title']}",
        "",
        mod["summary"],
        "",
        f"Analogy: {mod.get('analogy', '')}",
        "",
    ]
    for section in mod.get("sections", []):
        parts.append(f"## {section['h']}")
        parts.append("")
        for paragraph in section["p"]:
            parts.append(paragraph)
            parts.append("")
    for diagram in mod.get("diagrams", []):
        parts.append(f"## Diagram: {diagram['title']}")
        parts.append("")
        parts.append("```mermaid")
        parts.append(mermaid(diagram))
        parts.append("```")
        parts.append("")
        for index, item in enumerate(diagram["steps"], start=1):
            parts.append(f"{index}. **{item['title']}.** {item['text']}")
        parts.append("")
    if mod.get("examples"):
        parts.append("## Examples")
        parts.append("")
        for example in mod["examples"]:
            parts.append(f"- {example['domain']}: {example['name']}. {example['fact']} Source: {example['url']}")
        parts.append("")
    if mod.get("landing"):
        parts.append("## Landing")
        parts.append("")
        parts.append(mod["landing"])
        parts.append("")
    path.write_text("\n".join(parts), encoding="utf-8")


def write_html(mod: dict) -> None:
    path = ROOT / "modules" / f"{mod['id']}.html"
    title = mod["title"].replace("<", "")
    path.write_text(
        f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <link rel="stylesheet" href="../assets/theme.css">
</head>
<body data-page="{mod['id']}" data-root="../">
  <div id="app"></div>
  <script src="../assets/catalog.js"></script>
  <script src="../assets/simulators.js"></script>
  <script src="../assets/engine.js"></script>
</body>
</html>
""",
        encoding="utf-8",
    )


def main() -> None:
    (ROOT / "docs").mkdir(exist_ok=True)
    (ROOT / "modules").mkdir(exist_ok=True)
    catalog = ROOT / "assets" / "catalog.js"
    catalog.write_text(
        "window.API_LEARN_MODULES = " + json.dumps(MODULES, indent=2) + ";\n",
        encoding="utf-8",
    )
    for mod in MODULES:
        write_markdown(mod)
        write_html(mod)
    index = ROOT / "index.html"
    index.write_text(
        """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>How data moves</title>
  <link rel="stylesheet" href="assets/theme.css">
</head>
<body data-page="home" data-root="">
  <div id="app"></div>
  <script src="assets/catalog.js"></script>
  <script src="assets/simulators.js"></script>
  <script src="assets/engine.js"></script>
</body>
</html>
""",
        encoding="utf-8",
    )
    print(f"wrote {len(MODULES)} modules")


if __name__ == "__main__":
    main()
