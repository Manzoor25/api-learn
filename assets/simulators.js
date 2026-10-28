/* Four teaching simulators. Numbers are models, labeled as such. */
(function () {
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (key === "class") node.className = value;
      else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
      else if (value !== null && value !== undefined) node.setAttribute(key, value);
    });
    (children || []).forEach((child) => node.append(child.nodeType ? child : document.createTextNode(String(child))));
    return node;
  }

  function slider(label, min, max, step, value, oninput) {
    const output = el("output", {}, [String(value)]);
    const input = el("input", { type: "range", min: min, max: max, step: step, value: value, "aria-label": label });
    input.addEventListener("input", () => {
      output.textContent = input.value;
      oninput(Number(input.value));
    });
    return el("label", { class: "slider", style: "display:block;margin:8px 0" }, [label + " ", output, input]);
  }

  function fmt(seconds) {
    if (seconds < 90) return seconds.toFixed(1) + " seconds";
    if (seconds < 3600) return (seconds / 60).toFixed(1) + " minutes";
    return (seconds / 3600).toFixed(2) + " hours";
  }

  function throughput(host) {
    const state = { records: 1000000, page: 1000, latency: 300, conc: 4, rate: 5, fileMb: 800, fileParallel: 4 };
    const out = el("div");
    const lanes = el("div", { class: "lanes" });
    function render() {
      const pages = Math.ceil(state.records / state.page);
      const sequential = pages * (state.latency / 1000);
      const parallel = sequential / state.conc;
      const rateFloor = pages / state.rate;
      const api = Math.max(parallel, rateFloor);
      const fileSeconds = (state.fileMb / 20) / state.fileParallel;
      const bottleneck = api >= fileSeconds
        ? (rateFloor >= parallel ? "API rate limit" : "API round trips")
        : "file download parallelism";
      out.replaceChildren(
        el("p", {}, ["Pages: " + pages.toLocaleString() + ". API estimate: ", el("strong", {}, [fmt(api)]), ". File estimate: ", el("strong", {}, [fmt(fileSeconds)]), "."]),
        el("p", {}, [el("span", { class: bottleneck.includes("rate") ? "warn" : "ok" }, ["Bottleneck: " + bottleneck])]),
        el("p", { class: "small" }, [
          rateFloor >= parallel
            ? "Raising concurrency will not beat pages / rate_limit. It will add 429s. This is a model, not a vendor quota."
            : "Concurrency still helps, until it crosses the rate-limit floor of " + fmt(rateFloor) + ".",
        ])
      );
      lanes.replaceChildren();
      const apiWidth = Math.min(100, 20 + (1 / api) * 800);
      const fileWidth = Math.min(100, 20 + (1 / fileSeconds) * 800);
      [["API pull", apiWidth, "#3b82f6"], ["File download", fileWidth, "#10b981"]].forEach(([name, width, color]) => {
        const lane = el("div", { class: "lane" });
        lane.append(el("div", { style: "position:absolute;left:0;top:0;bottom:0;width:" + width + "%;background:" + color + ";opacity:.5" }));
        const packet = el("div", { class: "packet", style: "background:" + color });
        if (!document.body.classList.contains("reduce-motion")) {
          packet.style.animation = "flow 2.2s linear infinite";
        }
        lane.append(packet);
        lane.append(el("span", {}, [name]));
        lanes.append(lane);
      });
    }
    host.append(
      el("h2", { style: "margin-top:0" }, ["Throughput calculator"]),
      slider("Records", 1000, 5000000, 1000, state.records, (v) => { state.records = v; render(); }),
      slider("Page size", 10, 10000, 10, state.page, (v) => { state.page = v; render(); }),
      slider("Latency ms", 20, 2000, 10, state.latency, (v) => { state.latency = v; render(); }),
      slider("Concurrency", 1, 32, 1, state.conc, (v) => { state.conc = v; render(); }),
      slider("Rate limit per second", 0.2, 50, 0.2, state.rate, (v) => { state.rate = v; render(); }),
      slider("File size MB", 10, 5000, 10, state.fileMb, (v) => { state.fileMb = v; render(); }),
      slider("Download parallelism", 1, 16, 1, state.fileParallel, (v) => { state.fileParallel = v; render(); }),
      out,
      lanes,
      el("p", { class: "small" }, ["File model assumes 20 MB/s per stream. Change the sliders; the formula is pages × latency / concurrency, capped by pages / rate limit."])
    );
    render();
  }

  function stream(host) {
    const state = { rate: 40, consumers: 3, killed: false, tick: 0, committed: [0, 0, 0], end: [0, 0, 0] };
    const view = el("div");
    let timer = null;
    function render() {
      const owners = state.killed ? [0, 1, 0] : [0, 1, 2];
      view.replaceChildren();
      for (let p = 0; p < 3; p++) {
        const lag = state.end[p] - state.committed[p];
        const lane = el("div", { class: "lane" });
        lane.append(el("span", {}, ["partition " + p + " owner c" + owners[p] + " lag " + lag]));
        view.append(lane);
      }
      view.append(el("p", {}, [
        state.killed
          ? "Consumer 2 is dead. Its partition moved to consumer 0. Uncommitted events replay. That is at-least-once, not data loss, if the write is idempotent."
          : "Each consumer checkpoints its own offsets. Lag grows when the event rate outruns the group.",
      ]));
    }
    function step() {
      state.tick += 1;
      const owners = state.killed ? [0, 1, 0] : [0, 1, 2];
      for (let p = 0; p < 3; p++) {
        state.end[p] += Math.ceil(state.rate / 3);
        const alive = state.killed ? 2 : state.consumers;
        if (state.committed[p] < state.end[p]) state.committed[p] += Math.max(1, Math.floor(alive * 4));
        if (state.committed[p] > state.end[p]) state.committed[p] = state.end[p];
        void owners;
      }
      render();
    }
    host.append(
      el("h2", {}, ["Streaming simulator"]),
      slider("Events per second", 5, 200, 5, state.rate, (v) => { state.rate = v; }),
      slider("Consumers", 1, 6, 1, state.consumers, (v) => { state.consumers = v; }),
      el("button", { type: "button", onclick: () => { state.killed = !state.killed; render(); } }, ["Kill or restore consumer 2"]),
      view,
      el("p", { class: "small" }, ["Three partitions. A kill reassigns the partition and replays from the last checkpoint, not from zero."])
    );
    render();
    timer = setInterval(step, 700);
    window.addEventListener("beforeunload", () => clearInterval(timer));
  }

  function drift(host) {
    const state = { mode: "offset", page: 0 };
    const view = el("div", { class: "records", style: "display:flex;gap:6px;flex-wrap:wrap" });
    const note = el("p");
    function render() {
      view.replaceChildren();
      let ids;
      let mark = {};
      if (state.mode === "offset") {
        if (state.page === 0) {
          ids = [1, 2, 3, 4, 5, 6];
          mark = { 1: "seen", 2: "seen" };
          note.textContent = "Offset page 1 reads 1 and 2. The next call will skip 2, not 'continue after 2'.";
        } else {
          ids = [9, 1, 2, 3, 4, 5, 6];
          mark = { 9: "miss", 2: "dup", 3: "seen" };
          note.textContent = "A new row was inserted at the front. Skip 2 now returns 2 again and never sees 9. Duplicate and gap.";
        }
      } else {
        ids = [1, 2, 3, 4, 5, 6, 9];
        mark = state.page === 0 ? { 1: "seen", 2: "seen" } : { 1: "seen", 2: "seen", 3: "seen", 4: "seen" };
        note.textContent = state.page === 0
          ? "Keyset remembers last id 2."
          : "Next page is id > 2. The inserted row 9 is still ahead of the cursor, so it is not skipped.";
      }
      ids.forEach((id) => {
        const color = mark[id] === "dup" ? "#f59e0b" : mark[id] === "miss" ? "#f87171" : mark[id] === "seen" ? "#4ade80" : "#334155";
        view.append(el("span", { class: "chip", style: "border-color:" + color }, [String(id)]));
      });
    }
    host.append(
      el("h2", {}, ["Offset drift"]),
      el("button", { type: "button", onclick: () => { state.mode = "offset"; state.page = 0; render(); } }, ["Offset"]),
      el("button", { type: "button", onclick: () => { state.mode = "keyset"; state.page = 0; render(); } }, ["Keyset"]),
      el("button", { type: "button", onclick: () => { state.page = 1; render(); } }, ["Next page"]),
      view,
      note
    );
    render();
  }

  function webhook(host) {
    const state = { drop: 20, reconcile: false };
    const view = el("div");
    function render() {
      const total = 20;
      const dropped = Math.round(total * state.drop / 100);
      const received = total - dropped;
      const recovered = state.reconcile ? dropped : 0;
      view.replaceChildren(
        el("p", {}, ["Sent " + total + ". Delivered " + received + ". Missing " + (dropped - recovered) + ". Recovered by reconciliation " + recovered + "."]),
        el("p", {}, [state.reconcile
          ? "The doorbell missed some rings. A scheduled pull of the order API filled the gaps. Webhooks alone are not a system of record."
          : "Dropped webhooks are gone unless something else notices. Turn on reconciliation."])
      );
    }
    host.append(
      el("h2", {}, ["Webhook reliability"]),
      slider("Drop percent", 0, 80, 5, state.drop, (v) => { state.drop = v; render(); }),
      el("button", { type: "button", onclick: () => { state.reconcile = !state.reconcile; render(); } }, ["Toggle reconciliation"]),
      view
    );
    render();
  }

  window.API_LEARN_SIMS = {
    mount: function () {
      throughput(document.getElementById("throughput"));
      stream(document.getElementById("stream"));
      drift(document.getElementById("drift"));
      webhook(document.getElementById("webhook"));
    },
  };
})();
