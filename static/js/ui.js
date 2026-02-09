// static/js/ui.js

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // -------------------------
  // Active nav link (matches route)
  // -------------------------
  function setActiveNav() {
    const path = (window.location.pathname || "").toLowerCase();
    $$(".bb-nav a").forEach(a => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      const active =
        href && (path === href || (href !== "/" && path.startsWith(href)));
      a.classList.toggle("is-active", !!active);
    });
  }

  // -------------------------
  // Pill group behavior (data-group + data-value)
  // Example:
  // <div class="bb-pill-group" data-group="difficulty">
  //   <button class="bb-pill" data-value="easy">EASY</button>
  // </div>
  // Hidden input:
  // <input type="hidden" name="difficulty" id="difficulty" />
  // -------------------------
  function initPillGroups() {
    $$("[data-group]").forEach(group => {
      const name = group.getAttribute("data-group");
      const hidden = document.getElementById(name) || group.querySelector(`input[type="hidden"][name="${name}"]`);
      const pills = $$("[data-value]", group);

      function setValue(val) {
        pills.forEach(p => p.classList.toggle("is-active", p.getAttribute("data-value") === val));
        if (hidden) hidden.value = val;
        group.dispatchEvent(new CustomEvent("pill:change", { detail: { name, value: val } }));
      }

      pills.forEach(p => {
        p.addEventListener("click", (e) => {
          e.preventDefault();
          setValue(p.getAttribute("data-value"));
        });
      });

      // default: first active, or first pill
      const preset = (hidden && hidden.value) || (pills.find(p => p.classList.contains("is-active"))?.getAttribute("data-value")) || pills[0]?.getAttribute("data-value");
      if (preset) setValue(preset);
    });
  }

  // -------------------------
  // Toasts
  // -------------------------
  function toast(title, message, ms = 2600) {
    const node = document.createElement("div");
    node.className = "bb-toast";
    node.innerHTML = `
      <div class="t">${escapeHtml(title || "NOTICE")}</div>
      <div class="m">${escapeHtml(message || "")}</div>
    `;
    document.body.appendChild(node);
    setTimeout(() => {
      node.style.transition = "opacity .18s ease, transform .18s ease";
      node.style.opacity = "0";
      node.style.transform = "translateY(8px)";
      setTimeout(() => node.remove(), 220);
    }, ms);
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // -------------------------
  // Board helpers
  // -------------------------
  // Expects:
  // <div class="bb-board" id="board" data-size="3">
  //   <svg class="bb-winline" id="winline" viewBox="0 0 100 100" preserveAspectRatio="none">
  //     <line x1="10" y1="10" x2="90" y2="90"></line>
  //   </svg>
  // </div>
  //
  // Call window.BlackboxUI.showWinLine({x1,y1,x2,y2}) where coords are cell indices,
  // e.g. (0,0) -> (2,2) on 3x3.
  function showWinLine(boardEl, lineEl, size, x1, y1, x2, y2) {
    if (!boardEl || !lineEl) return;
    const s = Number(size || boardEl.getAttribute("data-size") || 3);

    // Map cell center to SVG 0..100
    const cell = 100 / s;
    const cx = (x) => (x + 0.5) * cell;
    const cy = (y) => (y + 0.5) * cell;

    const ln = lineEl.querySelector("line");
    if (!ln) return;

    ln.setAttribute("x1", cx(x1));
    ln.setAttribute("y1", cy(y1));
    ln.setAttribute("x2", cx(x2));
    ln.setAttribute("y2", cy(y2));

    lineEl.classList.add("is-show");
  }

  function hideWinLine(lineEl) {
    if (!lineEl) return;
    lineEl.classList.remove("is-show");
  }

  // -------------------------
  // Public API
  // -------------------------
  window.BlackboxUI = {
    toast,
    showWinLine: (opts = {}) => {
      const boardEl = opts.boardEl || document.getElementById("board");
      const lineEl = opts.lineEl || document.getElementById("winline");
      const size = opts.size || boardEl?.getAttribute("data-size") || 3;
      showWinLine(boardEl, lineEl, size, opts.x1, opts.y1, opts.x2, opts.y2);
    },
    hideWinLine: (lineEl) => hideWinLine(lineEl || document.getElementById("winline"))
  };

  // Init
  document.addEventListener("DOMContentLoaded", () => {
    setActiveNav();
    initPillGroups();
  });
})();
