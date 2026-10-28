"""Small builders so module pages and Mermaid stay generated from one spec."""


def nodes(*items):
    out = []
    for index, item in enumerate(items):
        node_id, label, kind = item
        out.append({"id": node_id, "label": label, "kind": kind, "x": 16 + index * 150, "y": 96})
    return out


def flow(title, node_list, steps, blurb="Packets move only on the highlighted hop."):
    return {"type": "flow", "title": title, "blurb": blurb, "nodes": node_list, "steps": steps}


def seq(title, actors, steps, blurb="Each arrow is one interaction. Step through it."):
    return {"type": "sequence", "title": title, "blurb": blurb, "actors": actors, "steps": steps}


def state(title, states, steps, blurb="The glowing state is where you are."):
    return {"type": "state", "title": title, "blurb": blurb, "states": states, "steps": steps}


def race(title, lanes, steps, blurb="Same dataset, different delivery. Illustrative times, not a benchmark."):
    return {"type": "race", "title": title, "blurb": blurb, "lanes": lanes, "steps": steps}


def step(title, text, hot=None, packets=None, phase=None, state_name=None, **extra):
    body = {"title": title, "text": text}
    if hot:
        body["hot"] = hot
    if packets:
        body["packets"] = packets
    if phase:
        body["phase"] = phase
    if state_name:
        body["state"] = state_name
    body.update(extra)
    return body


def sstep(frm, to, label, title, text, phase=None):
    body = {"from": frm, "to": to, "label": label, "title": title, "text": text}
    if phase:
        body["phase"] = phase
    return body


def mod(**kwargs):
    kwargs.setdefault("minutes", 12)
    kwargs.setdefault("sections", [])
    kwargs.setdefault("diagrams", [])
    kwargs.setdefault("examples", [])
    if "pull" in kwargs and "map" not in kwargs:
        kwargs["map"] = {"pull": kwargs["pull"], "realtime": kwargs.get("realtime", 0)}
    return kwargs
