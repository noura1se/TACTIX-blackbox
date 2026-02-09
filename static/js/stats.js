// static/js/game.js
(() => {
  const API = {
    state: "/api/state",
    move: "/api/move",
    undo: "/api/undo",
    reset: "/api/reset",
    scan: "/api/scan",
  };

  const elBoard = document.getElementById("board");
  const elStatus = document.getElementById("statusText");
  const elMeta = document.getElementById("metaText");
  const elTerm = document.getElementById("terminalLog");

  const btnScan = document.getElementById("btnScan");
  const btnUndo = document.getElementById("btnUndo");
  const btnReset = document.getElementById("btnReset");

  const state = {
    board: [],
    legalMoves: [],
    status: { state: "ONGOING", winner: null, winLine: null },
    scan: null,
  };

  function stamp() {
    return new Date().toLocaleTimeString();
  }

  function log(msg) {
    if (!elTerm) return;
    const line = document.createElement("div");
    line.className = "bb-terminal-line";
    line.textContent = `[${stamp()}] ${msg}`;
    elTerm.prepend(line);
  }

  async function getJSON(url) {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || data?.success === false) {
      throw new Error(data?.message || `GET failed (${res.status})`);
    }
    return data;
  }

  async function postJSON(url, body = {}) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || data?.success === false) {
      throw new Error(data?.message || `POST failed (${res.status})`);
    }
    return data;
  }

  function setStatus(status) {
    const st = status?.state || "ONGOING";
    if (st === "WIN") elStatus.textContent = `BREACH CONFIRMED: ${status.winner} WINS`;
    else if (st === "DRAW") elStatus.textContent = "STALEMATE: DRAW";
    else elStatus.textContent = "STATE: ONGOING";
  }

  function ensureWinLineSvg() {
    // Keep win line SVG present even if render() rebuilds the board
    if (!elBoard) return;
    if (elBoard.querySelector("#winline")) return;

    elBoard.insertAdjacentHTML(
      "afterbegin",
      `
      <svg class="bb-winline" id="winline" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="10" y1="10" x2="90" y2="90"></line>
      </svg>
      `.trim()
    );
  }

  function render(board2d, legalMoves, scan) {
    const size = board2d.length;

    // ✅ Important: drive CSS grid-line density (3/4/5) from data-size
    elBoard.dataset.size = String(size);

    const legal = new Set(legalMoves || []);
    const best = new Set(scan?.bestMoves ?? []);
    const danger = new Set(scan?.dangerMoves ?? []);
    const winLine = state.status?.winLine;

    elBoard.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

    // If your template already includes the winline SVG, keep it.
    // We clear cells only, not necessarily the SVG, but safest is rebuild then re-add SVG.
    elBoard.innerHTML = "";
    ensureWinLineSvg();

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const idx = r * size + c;
        const v = board2d[r][c];

        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "bb-cell";
        cell.dataset.pos = String(idx);

        if (v) cell.classList.add(v === "X" ? "is-x" : "is-o");
        if (!v && legal.has(idx) && state.status.state === "ONGOING") cell.classList.add("is-legal");

        if (best.has(idx)) cell.classList.add("is-best");
        if (danger.has(idx)) cell.classList.add("is-danger");

        // If backend returns winLine as flat indexes, highlight those cells
        if (Array.isArray(winLine) && winLine.includes(idx)) cell.classList.add("is-win");

        cell.textContent = v ? v : "";
        elBoard.appendChild(cell);
      }
    }
  }

  function applyPayload(data) {
    state.board = data.state.board;
    state.legalMoves = data.legalMoves || [];
    state.status = data.status || { state: "ONGOING", winner: null, winLine: null };
    setStatus(state.status);
    render(state.board, state.legalMoves, state.scan);
  }

  async function loadState() {
    const res = await getJSON(API.state);
    state.scan = null;
    applyPayload(res.data);
    elMeta.textContent = "DEPTH: - | SCORE: -";
    log("State synced.");
  }

  async function doMove(pos) {
    const res = await postJSON(API.move, { pos });
    const d = res.data;

    // move clears scan highlights (fresh board)
    state.scan = null;
    applyPayload(d);

    if (d.aiMeta) {
      elMeta.textContent = `DEPTH: ${d.aiMeta.depth} | SCORE: ${d.aiMeta.score}`;
      log(`AI ${d.aiMeta.difficulty} depth=${d.aiMeta.depth} score=${d.aiMeta.score}`);
    } else {
      elMeta.textContent = "DEPTH: - | SCORE: -";
    }
  }

  async function doUndo() {
    const res = await postJSON(API.undo, {});
    state.scan = null;
    applyPayload(res.data);
    elMeta.textContent = "DEPTH: - | SCORE: -";
    log("Firewall lock: undo executed.");
  }

  async function doReset() {
    const res = await postJSON(API.reset, {});
    state.scan = null;
    applyPayload(res.data);
    elMeta.textContent = "DEPTH: - | SCORE: -";
    log("System reset.");
  }

  async function doScan() {
    const res = await postJSON(API.scan, {});
    state.scan = res.data.scan;
    render(state.board, state.legalMoves, state.scan);
    log("Exploit scan complete.");
  }

  elBoard?.addEventListener("click", (e) => {
    const btn = e.target.closest(".bb-cell");
    if (!btn) return;

    const pos = Number(btn.dataset.pos);
    if (!Number.isFinite(pos)) return;

    if (!state.legalMoves.includes(pos)) return;
    if (state.status.state !== "ONGOING") return;

    doMove(pos).catch((err) => alert(err.message));
  });

  btnScan?.addEventListener("click", () => doScan().catch((err) => alert(err.message)));
  btnUndo?.addEventListener("click", () => doUndo().catch((err) => alert(err.message)));
  btnReset?.addEventListener("click", () => doReset().catch((err) => alert(err.message)));

  loadState().catch((err) => alert(err.message));
})();
