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
      "position:fixed;width:14px;height:14px;background:#b59410;border:2px solid #000;box-sizing:border-box;z-index:99999;display:none;pointer-events:auto;border-radius:2px;touch-action:none;";
    h.style.cursor = resizeCursors[d];
    document.body.appendChild(h);
    h.addEventListener("pointerdown", (ev) => {
      if (!selectedEl) return;
      ev.preventDefault();
      ev.stopPropagation();
      try { h.setPointerCapture(ev.pointerId); } catch (e) {}
      const el = selectedEl;
      const r = el.getBoundingClientRect();
      const scale = (window.__deckCanvas && window.__deckCanvas.getScale && window.__deckCanvas.getScale()) || 1;
      const startW = r.width / scale;
      const startH = r.height / scale;
      resizeState = {
        el,
        handle: h,
        pointerId: ev.pointerId,
        dir: d,
        startX: ev.clientX,
        startY: ev.clientY,
        startW,
        startH,
        ratio: startH > 0 ? startW / startH : 1,
        aspect: !ev.altKey, // hold Alt to free-resize
      };
      el.style.setProperty("will-change", "width, height");
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
    // If element is small, push handles outside so they don't block dragging the image itself.
    const small = r.width < 60 || r.height < 60;
    const off = small ? 10 : 0; // outward offset in px
    const pos = {
      nw: [r.left - off, r.top - off], ne: [r.right + off, r.top - off],
      sw: [r.left - off, r.bottom + off], se: [r.right + off, r.bottom + off],
      n: [cx, r.top - off], s: [cx, r.bottom + off],
      w: [r.left - off, cy], e: [r.right + off, cy],
    };
    RESIZE_DIRS.forEach((d) => {
      const [x, y] = pos[d];
      const h = resizeHandles[d];
      // When small, hide edge handles (keep only corners) to reduce clutter.
      if (small && (d === "n" || d === "s" || d === "e" || d === "w")) {
        h.style.display = "none";
        return;
      }
      h.style.left = x - 7 + "px";
      h.style.top = y - 7 + "px";
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

  function isSelectable(el) {
    if (!el || !el.dataset || !el.dataset.editId) return false;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function editableArea(el) {
    const r = el.getBoundingClientRect();
    return Math.max(1, r.width * r.height);
  }

  function editableFromPoint(x, y, opts) {
    const options = opts || {};
    const seen = new Set();
    const candidates = [];
    const add = (el, source) => {
      if (!isSelectable(el) || seen.has(el)) return;
      seen.add(el);
      candidates.push({ el, source, area: editableArea(el) });
    };

    document.elementsFromPoint(x, y).forEach((node) => {
      const el = node.closest && node.closest("[data-edit-id]");
      if (el) add(el, "stack");
    });

    // Tiny images can be impossible to hit precisely after the slide is scaled.
    // Add a small canvas-aware hit slop, then prefer the smallest image at the point.
    const scale = getScale();
    const slop = options.imageSlop === false ? 0 : Math.max(10, 16 * scale);
    document.querySelectorAll('[data-edit-kind="image"]').forEach((img) => {
      const r = img.getBoundingClientRect();
      const isSmall = r.width < 72 || r.height < 72;
      if (!isSmall && !options.preferImages) return;
      if (
        x >= r.left - slop &&
        x <= r.right + slop &&
        y >= r.top - slop &&
        y <= r.bottom + slop
      ) {
        add(img, "image-slop");
      }
    });

    if (!candidates.length) return null;
    candidates.sort((a, b) => {
      const aImg = a.el.dataset.editKind === "image" ? 1 : 0;
      const bImg = b.el.dataset.editKind === "image" ? 1 : 0;
      if (options.preferImages && aImg !== bImg) return bImg - aImg;
      const aSelected = a.el === selectedEl ? 1 : 0;
      const bSelected = b.el === selectedEl ? 1 : 0;
      if (aSelected !== bSelected) return bSelected - aSelected;
      return a.area - b.area;
    });
    return candidates[0].el;
  }

  document.addEventListener(
    "click",
    (e) => {
      if (e.target.classList && e.target.classList.contains("__resize-handle")) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (dragState && dragState.moved) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const el = editableFromPoint(e.clientX, e.clientY, { preferImages: true }) || e.target.closest("[data-edit-id]");
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
      const el = editableFromPoint(e.clientX, e.clientY) || e.target.closest("[data-edit-id]");
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
      const el = editableFromPoint(e.clientX, e.clientY, { preferImages: true }) || e.target.closest("[data-edit-id]");
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

  const getScale = () => {
    const g = window.__deckCanvas;
    return g && typeof g.getScale === 'function' ? Math.max(g.getScale(), 0.0001) : 1;
  };

  document.addEventListener("mousemove", (e) => {
    if (!dragState) return;
    const scale = getScale();
    const dx = (e.clientX - dragState.startX) / scale;
    const dy = (e.clientY - dragState.startY) / scale;
    if (Math.abs(dx) + Math.abs(dy) > 3) dragState.moved = true;
    if (!dragState.moved) return;
    const tx = dragState.origTx + dx;
    const ty = dragState.origTy + dy;
    dragState.el.style.transform = `translate(${tx}px, ${ty}px)`;
    const rect = dragState.el.getBoundingClientRect();
    handleLabel.style.left = rect.left + "px";
    handleLabel.style.top = Math.max(0, rect.top - 20) + "px";
    positionResizeHandles();
  });

  let resizeRaf = 0;
  let lastResizeEv = null;
  function applyResizeFrame() {
    resizeRaf = 0;
    if (!resizeState || !lastResizeEv) return;
    const e = lastResizeEv;
    const el = resizeState.el;
    const scale = getScale();
    const dx = (e.clientX - resizeState.startX) / scale;
    const dy = (e.clientY - resizeState.startY) / scale;
    const dir = resizeState.dir;
    const signX = dir.includes("e") ? 1 : dir.includes("w") ? -1 : 0;
    const signY = dir.includes("s") ? 1 : dir.includes("n") ? -1 : 0;
    let newW = Math.max(20, resizeState.startW + dx * signX);
    let newH = Math.max(20, resizeState.startH + dy * signY);
    const isCorner = signX !== 0 && signY !== 0;
    if (resizeState.aspect && (isCorner || signX !== 0)) {
      newH = newW / resizeState.ratio;
    } else if (resizeState.aspect && signY !== 0) {
      newW = newH * resizeState.ratio;
    }
    if (signX !== 0 || (resizeState.aspect && signY !== 0))
      el.style.setProperty("width", Math.round(newW) + "px", "important");
    if (signY !== 0 || (resizeState.aspect && signX !== 0))
      el.style.setProperty("height", Math.round(newH) + "px", "important");
    positionResizeHandles();
  }

  document.addEventListener("pointermove", (e) => {
    if (!resizeState) return;
    lastResizeEv = e;
    if (!resizeRaf) resizeRaf = requestAnimationFrame(applyResizeFrame);
  });

  // Sizes for the resizeState.startW/H were captured in on-screen (scaled) pixels;
  // divide by scale so subsequent math is in canvas pixels.
  const _origPointerDown = null; // (kept for future use)

  // Convert absolute px width/height to percentage of the fixed 1920x1080 canvas
  // so it renders identically at any viewport size.
  const toRelSize = (el) => {
    const cw = (window.__deckCanvas && window.__deckCanvas.w) || 1920;
    const ch = (window.__deckCanvas && window.__deckCanvas.h) || 1080;
    const w = parseFloat(el.style.width);
    const h = parseFloat(el.style.height);
    const out = {};
    if (!isNaN(w) && el.style.width.endsWith("px") && cw > 0) {
      const pct = (w / cw) * 100;
      out.width = pct.toFixed(3) + "%";
      el.style.setProperty("width", out.width, "important");
    } else {
      out.width = el.style.width;
    }
    if (!isNaN(h) && el.style.height.endsWith("px") && ch > 0) {
      const pct = (h / ch) * 100;
      out.height = pct.toFixed(3) + "%";
      el.style.setProperty("height", out.height, "important");
    } else {
      out.height = el.style.height;
    }
    return out;
  };

  // Store transform as translate in canvas pixels (invariant across viewports).
  const toRelTransform = (el) => {
    const m = el.style.transform;
    if (!m) return "";
    const match = m.match(/translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px\s*\)/);
    if (!match) return m;
    const next = `translate(${parseFloat(match[1]).toFixed(2)}px, ${parseFloat(match[2]).toFixed(2)}px)`;
    el.style.transform = next;
    return next;
  };


  const endResize = () => {
    if (!resizeState) return;
    const el = resizeState.el;
    try { resizeState.handle.releasePointerCapture(resizeState.pointerId); } catch (e) {}
    if (resizeRaf) { cancelAnimationFrame(resizeRaf); resizeRaf = 0; }
    el.style.removeProperty("will-change");
    const rel = toRelSize(el);
    send({
      type: "style-changed",
      editId: el.dataset.editId,
      style: rel,
    });
    resizeState = null;
    lastResizeEv = null;
  };
  document.addEventListener("pointerup", endResize);
  document.addEventListener("pointercancel", endResize);

  document.addEventListener("mouseup", () => {
    if (!dragState) return;
    if (dragState.moved) {
      const transform = toRelTransform(dragState.el);
      send({
        type: "style-changed",
        editId: dragState.el.dataset.editId,
        style: { transform },
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
    positionResizeHandles();
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
    } else if (msg.type === "remove-element") {
      const el = document.querySelector(
        `[data-edit-id="${msg.editId.replace(/(["\\])/g, "\\$1")}"]`,
      );
      if (el) {
        if (selectedEl === el) selectElement(null);
        // Only remove inserted nodes; for original elements, just restore display.
        if (el.dataset.inserted === "1") el.remove();
        else el.style.removeProperty("display");
      }
      window.__deckOverrides = (window.__deckOverrides || []).filter(
        (o) => o.edit_id !== msg.editId,
      );
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
