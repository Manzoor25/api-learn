/* Diagram player and page renderer. No network calls, so it works from a double-clicked file. */
(function () {
  const KINDS = {
    source: "#3b82f6",
    ingestion: "#8b5cf6",
    queue: "#f59e0b",
    storage: "#10b981",
    processing: "#22d3ee",
    consumer: "#f472b6",
    error: "#f87171",
    retry: "#fb923c",
  };

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (key === "class") node.className = value;
      else if (key === "html") node.innerHTML = value;
      else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
      else if (value !== null && value !== undefined) node.setAttribute(key, value);
    });
    (children || []).forEach((child) => {
      if (child === null || child === undefined) return;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    });
    return node;
  }

  function rootPrefix() {
    return document.body.dataset.root || "";
  }

  function prefersReduce() {
    return localStorage.getItem("api-learn-reduce") === "1" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches && localStorage.getItem("api-learn-reduce") !== "0";
  }

  function setReduce(on) {
    localStorage.setItem("api-learn-reduce", on ? "1" : "0");
    document.body.classList.toggle("reduce-motion", on);
  }

  function header() {
    const reduce = prefersReduce();
    document.body.classList.toggle("reduce-motion", reduce);
    return el("header", { class: "top" }, [
      el("div", { class: "wrap" }, [
        el("a", { class: "brand", href: rootPrefix() + "index.html" }, ["How data moves"]),
        el("nav", { class: "top" }, [
          el("a", { href: rootPrefix() + "index.html" }, ["Map"]),
          el("a", { href: rootPrefix() + "modules/decision.html" }, ["Decide"]),
          el("a", { href: rootPrefix() + "modules/simulators.html" }, ["Simulators"]),
          el("a", { href: rootPrefix() + "modules/cheat-sheet.html" }, ["Cheat sheet"]),
          el("button", {
            type: "button",
            "aria-pressed": reduce ? "true" : "false",
            onclick: (event) => {
              const next = event.currentTarget.getAttribute("aria-pressed") !== "true";
              event.currentTarget.setAttribute("aria-pressed", next ? "true" : "false");
              setReduce(next);
            },
          }, ["Reduce motion"]),
        ]),
      ]),
    ]);
  }

  function legend() {
    const box = el("div", { class: "legend" });
    Object.entries({
      source: "source",
      ingestion: "ingestion",
      queue: "queue",
      storage: "storage",
      processing: "processing",
      consumer: "consumer",
      error: "error",
    }).forEach(([name, kind]) => {
      box.append(el("span", { class: "chip" }, [
        el("i", { class: "dot", style: "background:" + KINDS[kind] }),
        name,
      ]));
    });
    return box;
  }

  function Player(spec) {
    this.spec = spec;
    this.step = 0;
    this.playing = false;
    this.speed = 1;
    this.timer = null;
    this.root = el("section", { class: "diagram", "aria-label": spec.title });
    this.draw();
  }

  Player.prototype.schedule = function () {
    clearTimeout(this.timer);
    if (!this.playing || document.body.classList.contains("reduce-motion")) return;
    const wait = 1700 / this.speed;
    this.timer = setTimeout(() => {
      this.step = (this.step + 1) % this.spec.steps.length;
      this.draw();
      this.schedule();
    }, wait);
  };

  Player.prototype.draw = function () {
    const spec = this.spec;
    const step = spec.steps[this.step];
    const self = this;
    this.root.replaceChildren(
      el("h3", { style: "margin-top:0" }, [spec.title]),
      el("p", { class: "small" }, [spec.blurb || "Play, or step. The caption is the lesson."]),
      el("div", { class: "controls" }, [
        el("button", { type: "button", "aria-label": "Play", onclick: () => { self.playing = true; self.draw(); self.schedule(); } }, ["Play"]),
        el("button", { type: "button", "aria-label": "Pause", onclick: () => { self.playing = false; clearTimeout(self.timer); self.draw(); } }, ["Pause"]),
        el("button", { type: "button", "aria-label": "Step back", onclick: () => { self.playing = false; clearTimeout(self.timer); self.step = (self.step - 1 + spec.steps.length) % spec.steps.length; self.draw(); } }, ["Back"]),
        el("button", { type: "button", "aria-label": "Step forward", onclick: () => { self.playing = false; clearTimeout(self.timer); self.step = (self.step + 1) % spec.steps.length; self.draw(); } }, ["Forward"]),
        el("label", { class: "slider" }, [
          "Speed",
          el("input", {
            type: "range", min: "0.5", max: "3", step: "0.5", value: String(self.speed),
            "aria-label": "Animation speed",
            oninput: (event) => { self.speed = Number(event.target.value); },
          }),
        ]),
        el("span", { class: "small" }, ["Step " + (self.step + 1) + " of " + spec.steps.length + (self.playing ? " · playing" : " · paused")]),
      ]),
      el("div", { class: "phase " + (step.phase === "fix" ? "fix" : "") }, [step.phase === "fix" ? "Fix" : step.phase === "fail" ? "Failure" : ""]),
      el("div", { class: "caption-title" }, [step.title]),
      el("p", { class: "caption" }, [step.text]),
      renderScene(spec, this.step)
    );
  };

  function renderScene(spec, index) {
    if (spec.type === "state") return stateSvg(spec, index);
    if (spec.type === "sequence") return sequenceSvg(spec, index);
    if (spec.type === "race") return raceView(spec, index);
    return flowSvg(spec, index);
  }

  function flowSvg(spec, index) {
    const step = spec.steps[index];
    const nodes = spec.nodes;
    const width = 920;
    const height = 250;
    const svg = svgEl("svg", { class: "scene", viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": step.title });
    const edges = spec.edges || nodes.slice(1).map((node, i) => ({ from: nodes[i].id, to: node.id }));
    edges.forEach((edge) => {
      const a = nodes.find((node) => node.id === edge.from);
      const b = nodes.find((node) => node.id === edge.to);
      const hot = (step.hot || []).includes(edge.from) || (step.packets || []).some((packet) => packet.from === edge.from && packet.to === edge.to);
      svg.append(svgEl("line", {
        x1: a.x + 70, y1: a.y + 24, x2: b.x, y2: b.y + 24,
        stroke: hot ? "#fde68a" : "#314056", "stroke-width": hot ? 4 : 2,
      }));
      (step.packets || []).filter((packet) => packet.from === edge.from && packet.to === edge.to).forEach(() => {
        const circle = svgEl("circle", { r: 7, cy: a.y + 24, fill: KINDS[a.kind] || "#93c5fd" });
        if (!document.body.classList.contains("reduce-motion")) {
          const motion = svgEl("animate", {
            attributeName: "cx", from: a.x + 78, to: b.x - 8, dur: (1.1 / 1).toFixed(2) + "s", repeatCount: "indefinite",
          });
          circle.append(motion);
        } else {
          circle.setAttribute("cx", (a.x + b.x) / 2);
        }
        svg.append(circle);
      });
    });
    nodes.forEach((node) => {
      const hot = (step.hot || []).includes(node.id);
      svg.append(svgEl("rect", {
        x: node.x, y: node.y, width: 140, height: 48, rx: 8,
        fill: KINDS[node.kind] || "#334155",
        stroke: hot ? "#fde68a" : "transparent", "stroke-width": 3,
      }));
      svg.append(svgText(node.x + 70, node.y + 29, node.label, { "text-anchor": "middle", fill: "#0c1222", "font-size": "13", "font-weight": "700" }));
    });
    return svg;
  }

  function stateSvg(spec, index) {
    const step = spec.steps[index];
    const svg = svgEl("svg", { class: "scene", viewBox: "0 0 920 180", role: "img", "aria-label": step.title });
    spec.states.forEach((name, i) => {
      const x = 30 + i * 160;
      const on = name === step.state;
      svg.append(svgEl("rect", {
        x: x, y: 50, width: 140, height: 52, rx: 10,
        fill: on ? "#fde68a" : "#1e293b",
        stroke: on ? "#f59e0b" : "#314056", "stroke-width": on ? 4 : 1,
      }));
      svg.append(svgText(x + 70, 80, name, { "text-anchor": "middle", fill: on ? "#0c1222" : "#e8eef7", "font-size": "13" }));
      if (i < spec.states.length - 1) {
        svg.append(svgEl("line", { x1: x + 140, y1: 76, x2: x + 158, y2: 76, stroke: "#64748b", "stroke-width": 2 }));
      }
    });
    return svg;
  }

  function sequenceSvg(spec, index) {
    const step = spec.steps[index];
    const svg = svgEl("svg", { class: "scene", viewBox: "0 0 920 280", role: "img", "aria-label": step.title });
    const actors = spec.actors;
    const gap = 860 / Math.max(actors.length - 1, 1);
    actors.forEach((name, i) => {
      const x = 40 + i * gap;
      svg.append(svgEl("rect", { x: x - 50, y: 16, width: 110, height: 32, rx: 6, fill: "#1e293b" }));
      svg.append(svgText(x + 5, 37, name, { "text-anchor": "middle", fill: "#e8eef7", "font-size": "12" }));
      svg.append(svgEl("line", { x1: x, y1: 52, x2: x, y2: 260, stroke: "#314056", "stroke-dasharray": "4 4" }));
    });
    spec.steps.slice(0, index + 1).forEach((item, i) => {
      const y = 78 + i * 28;
      const x1 = 40 + item.from * gap;
      const x2 = 40 + item.to * gap;
      const current = i === index;
      svg.append(svgEl("line", {
        x1: x1, y1: y, x2: x2, y2: y,
        stroke: current ? "#fde68a" : "#64748b", "stroke-width": current ? 3 : 1,
      }));
      svg.append(svgText((x1 + x2) / 2, y - 6, item.label, {
        "text-anchor": "middle", fill: current ? "#fde68a" : "#a9b6c9", "font-size": "11",
      }));
      if (current && !document.body.classList.contains("reduce-motion")) {
        const packet = svgEl("circle", { r: 5, cy: y, fill: "#93c5fd" });
        packet.append(svgEl("animate", {
          attributeName: "cx", from: x1, to: x2, dur: "1s", repeatCount: "indefinite",
        }));
        svg.append(packet);
      }
    });
    return svg;
  }

  function raceView(spec, index) {
    const wrap = el("div", { class: "lanes" });
    const progress = spec.steps.length <= 1 ? 1 : index / (spec.steps.length - 1);
    spec.lanes.forEach((lane) => {
      const max = Math.max(...spec.lanes.map((item) => item.seconds));
      const done = progress >= lane.seconds / max;
      const width = Math.min(100, (progress / (lane.seconds / max)) * 100);
      const row = el("div", { class: "lane", title: lane.why });
      const bar = el("div", { style: "position:absolute;inset:0 auto 0 0;width:" + width + "%;background:" + (KINDS[lane.kind] || "#3b82f6") + ";opacity:.45" });
      row.append(bar);
      row.append(el("span", {}, [lane.name + (done ? " · arrived" : "")]));
      wrap.append(row);
      wrap.append(el("p", { class: "small" }, [lane.freshness]));
    });
    return wrap;
  }

  function svgEl(tag, attrs) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function svgText(x, y, text, attrs) {
    const node = svgEl("text", Object.assign({ x: x, y: y, "font-family": "Segoe UI, sans-serif" }, attrs));
    node.textContent = text;
    return node;
  }

  function renderModule(mod) {
    const app = document.getElementById("app");
    const parts = [header(), el("main", { class: "wrap" }, [
      el("p", { class: "small" }, [mod.family ? "Family " + mod.family : "Concept"]),
      el("h1", {}, [mod.title]),
      el("p", { class: "lede" }, [mod.summary]),
      el("p", {}, [el("strong", {}, ["Analogy. "]), mod.analogy || ""]),
      legend(),
    ])];
    const main = parts[1];
    (mod.sections || []).forEach((section) => {
      main.append(el("h2", {}, [section.h]));
      section.p.forEach((paragraph) => main.append(el("p", {}, [paragraph])));
    });
    (mod.diagrams || []).forEach((diagram) => main.append(new Player(diagram).root));
    if (mod.examples && mod.examples.length) {
      main.append(el("h2", {}, ["Real examples"]));
      const table = el("table", {}, [
        el("tr", {}, ["Domain", "Example", "What is verified", "Source"].map((name) => el("th", {}, [name]))),
      ]);
      mod.examples.forEach((example) => {
        table.append(el("tr", {}, [
          el("td", {}, [example.domain]),
          el("td", {}, [example.name]),
          el("td", {}, [example.fact]),
          el("td", {}, [el("a", { href: example.url }, [example.source || "docs"])]),
        ]));
      });
      main.append(el("div", { class: "card", style: "overflow-x:auto" }, [table]));
    }
    if (mod.landing) {
      main.append(el("h2", {}, ["Where it lands"]));
      main.append(el("p", {}, [mod.landing]));
    }
    main.append(el("p", { class: "small" }, [
      "Minutes: about " + (mod.minutes || 12) + ". ",
      el("a", { href: rootPrefix() + "docs/" + mod.id + ".md" }, ["Markdown with Mermaid"]),
    ]));
    app.replaceChildren(...parts, el("footer", { class: "wrap" }, ["Vendor numbers are labeled. Patterns are not limits."]));
  }

  function renderHome() {
    const app = document.getElementById("app");
    const modules = window.API_LEARN_MODULES.filter((mod) => mod.map);
    const map = el("div", { class: "map", "aria-label": "Pull versus push, batch versus real time" });
    map.append(el("div", { class: "map-label", style: "left:12px;bottom:8px" }, ["pull"]));
    map.append(el("div", { class: "map-label", style: "right:12px;bottom:8px" }, ["push"]));
    map.append(el("div", { class: "map-label", style: "left:12px;top:8px" }, ["real-time"]));
    map.append(el("div", { class: "map-label", style: "left:12px;bottom:28px" }, ["batch"]));
    modules.forEach((mod) => {
      const tile = el("a", {
        class: "tile",
        href: "modules/" + mod.id + ".html",
        style: "left:" + (8 + mod.map.pull * 84) + "%;top:" + (12 + (1 - mod.map.realtime) * 76) + "%",
      }, [el("i", { class: "pulse" }), mod.short || mod.title]);
      map.append(tile);
    });
    const grid = el("div", { class: "grid" });
    window.API_LEARN_MODULES.filter((mod) => mod.id !== "home").forEach((mod) => {
      grid.append(el("a", { class: "card family-card", href: "modules/" + mod.id + ".html" }, [
        el("strong", {}, [mod.title]),
        el("span", { class: "small" }, [mod.summary.slice(0, 140) + "…"]),
      ]));
    });
    app.replaceChildren(header(), el("main", { class: "wrap" }, [
      el("h1", {}, ["How data leaves a system, and how you land it without losing it"]),
      el("p", { class: "lede" }, ["Every source answers five questions: who moves the data, how much moves, how fresh it must be, whether you want a snapshot or a history, and what the provider refuses to do. The tiles pulse. Open one."]),
      legend(),
      map,
      el("h2", {}, ["Start here"]),
      el("ol", {}, [
        el("li", {}, ["Map, then ", el("a", { href: "modules/decision.html" }, ["the decision guide"]), " (20 minutes)."]),
        el("li", {}, ["The family you actually have. Pagination if you already know it, skip to rate limits or bulk export."]),
        el("li", {}, [el("a", { href: "modules/simulators.html" }, ["Simulators"]), " when a number is arguing with you."]),
        el("li", {}, ["Labs under labs/ when you want the failure in a terminal, not only on a diagram."]),
      ]),
      el("h2", {}, ["All modules"]),
      grid,
    ]));
  }

  function renderSimulators() {
    const app = document.getElementById("app");
    const main = el("main", { class: "wrap" }, [
      el("h1", {}, ["Simulators"]),
      el("p", { class: "lede" }, ["These numbers are models, not vendor limits. They show which term in the formula is in charge."]),
    ]);
    ["throughput", "stream", "drift", "webhook"].forEach((id) => {
      const host = el("section", { class: "card", id: id });
      main.append(host);
    });
    app.replaceChildren(header(), main);
    if (window.API_LEARN_SIMS) window.API_LEARN_SIMS.mount();
  }

  function boot() {
    const page = document.body.dataset.page;
    if (page === "home") renderHome();
    else if (page === "simulators") renderSimulators();
    else {
      const mod = window.API_LEARN_MODULES.find((item) => item.id === page);
      if (!mod) {
        document.getElementById("app").textContent = "Missing module " + page;
        return;
      }
      renderModule(mod);
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
