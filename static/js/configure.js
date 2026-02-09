(() => {
  const API_NEW = "/api/new";

  const cfg = {
    boardSize: 3,
    mode: "HUMAN_VS_AI",
    difficulty: "EASY",
  };

  function setActive(container, btn) {
    [...container.querySelectorAll("button")].forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
  }

  function save() {
    sessionStorage.setItem("tactix_config", JSON.stringify(cfg));
  }

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || data?.success === false) throw new Error(data?.message || `Request failed (${res.status})`);
    return data;
  }

  const grid = document.getElementById("gridSize");
  const mode = document.getElementById("mode");
  const diff = document.getElementById("difficulty");
  const start = document.getElementById("btnStart");

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-board-size]");
    if (!btn) return;
    cfg.boardSize = Number(btn.dataset.boardSize);
    setActive(grid, btn);
    save();
  });

  mode.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-mode]");
    if (!btn) return;
    cfg.mode = btn.dataset.mode;
    setActive(mode, btn);
    save();
  });

  diff.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-difficulty]");
    if (!btn) return;
    cfg.difficulty = btn.dataset.difficulty;
    setActive(diff, btn);
    save();
  });

  start.addEventListener("click", async () => {
    save();
    try {
      await postJSON(API_NEW, cfg);
      window.location.href = "/game";
    } catch (err) {
      alert(err.message);
    }
  });

  save();
})();