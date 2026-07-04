/* Catalyst Deck Editor
 * Loaded inside the iframe when ?edit=1 is present.
 * Adds click-to-select, drag-to-move, inline text editing.
 * Talks to parent window via postMessage.
 */
(function () {
  const PARENT_ORIGIN = "*"; // same origin in practice; permissive for preview subdomains
  let selectedEl = null;
  let overlayBox = null;
  let dragState = null;

  const style = document.createElement("style");
  style.textContent = `
    [data-edit-id] { outline: 1px dashed rgba(181,148,16,0.0); transition: outline-color 0.1s; cursor: pointer; }
    [data-edit-id]:hover { outline-color: rgba(181,148,16,0.6); }
    [data-edit-id].__selected { outline: 2px solid #b59410 !important; outline-offset: 2px; }
    [data-edit-id][contenteditable="true"] { outline: 2px solid #4a9eff !important; cursor: text; }
    body.__editing { user-select: none; }
    body.__editing .nav-dots, body.__editing .nav-hint { display: none !important; }
    .__drag-handle {
      position: fixed; z-index: 99999; background: #b59410; color: #000;
      font-size: 10px; padding: 2px 6px; border-radius: 3px; font-family: system-ui;
      pointer-events: none; letter-spacing: 0.05em; text-transform: uppercase;
    }
  `;
  document.head.appendChild(style);
  document.body.classList.add("__editing");

  const handleLabel = document.createElement("div");
  handleLabel.className = "__drag-handle";
  handleLabel.style.display = "none";
  document.body.appendChild(handleLabel);

  // Resize handles (for images)
  const RESIZE_DIRS = ["nw", "ne", "sw", "se", "n", "s", "e", "w"];
  const resizeCursors = {
    nw: "nwse-resize", se: "nwse-resize",
    ne: "nesw-resize", sw: "nesw-resize",
    n: "ns-resize", s: "ns-resize",
    e: "ew-resize", w: "ew-resize",
  };
  const resizeHandles = {};
  let resizeState = null;
  RESIZE_DIRS.forEach((d) => {
    const h = document.createElement("div");
    h.className = "__resize-handle";
    h.dataset.dir = d;
    h.style.cssText =
      "position:fixed;width:12px;height:12px;background:#b59410;border:2px solid #000;box-sizing:border-box;z-index:99999;display:none;pointer-events:auto;border-radius:2px;";
    h.style.cursor = resizeCursors[d];
    document.body.appendChild(h);
    h.addEventListener("mousedown", (ev) => {
      if (!selectedEl) return;
      ev.preventDefault();
      ev.stopPropagation();
      const r = selectedEl.getBoundingClientRect();
      resizeState = {
        dir: d,
        startX: ev.clientX,
        startY: ev.clientY,
        startW: r.width,
        startH: r.height,
        ratio: r.height > 0 ? r.width / r.height : 1,
        aspect: !ev.altKey, // hold Alt to free-resize
      };
    });
    resizeHandles[d] = h;
  });

  function positionResizeHandles() {
    const show = selectedEl && selectedEl.dataset.editKind === "image";
    if (!show) {
      RESIZE_DIRS.forEach((d) => (resizeHandles[d].style.display = "none"));
      return;
    }
    const r = selectedEl.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const pos = {
      nw: [r.left, r.top], ne: [r.right, r.top],
      sw: [r.left, r.bottom], se: [r.right, r.bottom],
      n: [cx, r.top], s: [cx, r.bottom],
      w: [r.left, cy], e: [r.right, cy],
    };
    RESIZE_DIRS.forEach((d) => {
      const [x, y] = pos[d];
      const h = resizeHandles[d];
      h.style.left = x - 6 + "px";
      h.style.top = y - 6 + "px";
      h.style.display = "block";
    });
  }

  function send(msg) {
    parent.postMessage({ source: "deck-editor", ...msg }, PARENT_ORIGIN);
  }

  function selectElement(el) {
    if (selectedEl === el) return;
    if (selectedEl) selectedEl.classList.remove("__selected");
    selectedEl = el;
    if (el) {
      el.classList.add("__selected");
      const rect = el.getBoundingClientRect();
      handleLabel.textContent = el.dataset.editId;
      handleLabel.style.left = rect.left + "px";
      handleLabel.style.top = Math.max(0, rect.top - 20) + "px";
      handleLabel.style.display = "block";
      const override = (window.__deckOverrides || []).find(
        (o) => o.edit_id === el.dataset.editId,
      );
      const cs = getComputedStyle(el);
      const rgbToHex = (rgb) => {
        const m = rgb && rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!m) return rgb || "";
        const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
        if (a === 0) return "transparent";
        const h = (n) => Number(n).toString(16).padStart(2, "0");
        return "#" + h(m[1]) + h(m[2]) + h(m[3]);
      };
      const computed = {
        color: rgbToHex(cs.color),
        backgroundColor: rgbToHex(cs.backgroundColor),
        fontSize: cs.fontSize,
        fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight,
        fontStyle: cs.fontStyle,
        textAlign: cs.textAlign,
        textTransform: cs.textTransform,
        letterSpacing: cs.letterSpacing,
        lineHeight: cs.lineHeight,
        opacity: cs.opacity,
        transform: cs.transform,
        width: cs.width,
        height: cs.height,
        padding: cs.padding,
        borderRadius: cs.borderRadius,
        zIndex: cs.zIndex,
      };
      send({
        type: "selected",
        editId: el.dataset.editId,
        kind: el.dataset.editKind,
        text: el.textContent.trim(),
        src: el.tagName === "IMG" ? el.src : null,
        override: override || null,
        computed,
      });
    } else {
      handleLabel.style.display = "none";
      send({ type: "selected", editId: null });
    }
    positionResizeHandles();
  }

  document.addEventListener(
    "click",
    (e) => {
      if (dragState && dragState.moved) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const el = e.target.closest("[data-edit-id]");
      if (el) {
        e.preventDefault();
        e.stopPropagation();
        selectElement(el);
      } else {
        selectElement(null);
      }
    },
    true,
  );

  document.addEventListener(
    "dblclick",
    (e) => {
      const el = e.target.closest("[data-edit-id]");
      if (!el || el.dataset.editKind !== "text") return;
      e.preventDefault();
      e.stopPropagation();
      selectElement(el);
      el.setAttribute("contenteditable", "true");
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      const finish = () => {
        el.removeAttribute("contenteditable");
        el.removeEventListener("blur", finish);
        el.removeEventListener("keydown", onKey);
        send({
          type: "text-edited",
          editId: el.dataset.editId,
          text: el.textContent,
        });
      };
      const onKey = (ev) => {
        if (ev.key === "Enter" && !ev.shiftKey) {
          ev.preventDefault();
          el.blur();
        } else if (ev.key === "Escape") {
          ev.preventDefault();
          el.blur();
        }
      };
      el.addEventListener("blur", finish);
      el.addEventListener("keydown", onKey);
    },
    true,
  );

  // Drag to move (adds transform translate)
  document.addEventListener(
    "mousedown",
    (e) => {
      const el = e.target.closest("[data-edit-id]");
      if (!el || el !== selectedEl) return;
      if (el.getAttribute("contenteditable") === "true") return;
      const rect = el.getBoundingClientRect();
      // Extract existing translate if any
      const cs = getComputedStyle(el);
      let tx = 0,
        ty = 0;
      const m = cs.transform;
      if (m && m !== "none") {
        const matrix = new DOMMatrix(m);
        tx = matrix.m41;
        ty = matrix.m42;
      }
      dragState = {
        el,
        startX: e.clientX,
        startY: e.clientY,
        origTx: tx,
        origTy: ty,
        moved: false,
      };
      e.preventDefault();
    },
    true,
  );

  document.addEventListener("mousemove", (e) => {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) dragState.moved = true;
    if (!dragState.moved) return;
    const tx = dragState.origTx + dx;
    const ty = dragState.origTy + dy;
    dragState.el.style.transform = `translate(${tx}px, ${ty}px)`;
    const rect = dragState.el.getBoundingClientRect();
    handleLabel.style.left = rect.left + "px";
    handleLabel.style.top = Math.max(0, rect.top - 20) + "px";
  });

  document.addEventListener("mouseup", () => {
    if (!dragState) return;
    if (dragState.moved) {
      send({
        type: "style-changed",
        editId: dragState.el.dataset.editId,
        style: { transform: dragState.el.style.transform },
      });
    }
    dragState = null;
  });

  // Update selection outline position on scroll/resize
  const reposition = () => {
    if (!selectedEl) return;
    const rect = selectedEl.getBoundingClientRect();
    handleLabel.style.left = rect.left + "px";
    handleLabel.style.top = Math.max(0, rect.top - 20) + "px";
  };
  window.addEventListener("scroll", reposition, true);
  window.addEventListener("resize", reposition);

  // Listen for commands from the parent
  window.addEventListener("message", (e) => {
    const msg = e.data;
    if (!msg || msg.source !== "deck-editor-parent") return;
    if (msg.type === "apply-override") {
      window.__deck.applyOverride(msg.override);
      // If this was applied to selection, keep it selected
      if (selectedEl && selectedEl.dataset.editId === msg.override.edit_id) {
        reposition();
      }
    } else if (msg.type === "reload-overrides") {
      window.__deck.applyAll().then(() => {
        if (selectedEl) reposition();
      });
    } else if (msg.type === "scroll-to") {
      const el = document.getElementById(msg.sceneId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (msg.type === "deselect") {
      selectElement(null);
    } else if (msg.type === "focus-edit-id") {
      const el = document.querySelector(
        `[data-edit-id="${msg.editId.replace(/(["\\])/g, "\\$1")}"]`,
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        selectElement(el);
      }
    }
  });

  // Announce ready
  send({
    type: "ready",
    scenes: Array.from(document.querySelectorAll(".scene")).map((s) => ({
      id: s.id,
      label: s.querySelector(".scene-label")?.textContent?.trim() || s.id,
    })),
  });
})();
