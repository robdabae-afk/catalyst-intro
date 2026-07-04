/* Catalyst Deck Overlay
 * Tags editable elements with stable data-edit-id values,
 * fetches deck_overrides from Lovable Cloud, and applies them.
 * Loaded on both the public view and the editor iframe.
 */
(function () {
  const SUPABASE_URL = "https://cpwykexuejexnpygfhlt.supabase.co";
  const SUPABASE_ANON =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwd3lrZXh1ZWpleG5weWdmaGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzI0MjMsImV4cCI6MjA4MDQwODQyM30.B1Px9cj3FPSdHXl-vTLbbfuEO3Alm5dWcfePYYz7xcg";
  const DECK_SLUG = "catalyst";

  // Selectors of things editable inside each .scene, in order of tagging.
  const EDITABLE_SELECTORS = [
    ".cover-title",
    ".cover-tagline",
    ".cover-footer",
    ".section-eyebrow",
    ".section-title",
    ".section-body p",
    ".traction-headline",
    ".traction-num",
    ".traction-label",
    ".traction-caption",
    ".problem-hero",
    ".problem-body p",
    ".solution-tagline",
    ".solution-sub",
    ".compare-then",
    ".compare-now",
    ".pillar-num",
    ".pillar-title",
    ".pillar-body",
    ".flywheel-text",
    ".market-tier-label",
    ".market-tier-num",
    ".market-tier-desc",
    ".model-num",
    ".model-name",
    ".model-desc",
    ".team-name",
    ".team-role",
    ".team-bio",
    ".team-initials",
    ".team-photo img",
    ".ask-amount",
    ".ask-type",
    ".ask-use-pct",
    ".ask-use-label",
    ".ask-use-desc",
    ".ask-close",
    ".scene-label",
  ];

  function tagElements() {
    const scenes = document.querySelectorAll(".scene");
    scenes.forEach((scene) => {
      const sceneId = scene.id || "scene";
      const counters = new Map();
      EDITABLE_SELECTORS.forEach((sel) => {
        const nodes = scene.querySelectorAll(sel);
        nodes.forEach((node) => {
          if (node.dataset.editId) return;
          const key = sel.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");
          const idx = counters.get(sel) || 0;
          counters.set(sel, idx + 1);
          node.dataset.editId = `${sceneId}::${key}::${idx}`;
          node.dataset.editKind =
            node.tagName === "IMG" ? "image" : "text";
        });
      });
    });
  }

  function applyOverride(o) {
    if (o.kind === "insert") {
      applyInsert(o);
      return;
    }
    const el = document.querySelector(
      `[data-edit-id="${cssEscape(o.edit_id)}"]`,
    );
    if (!el) return;
    el.dataset.hasOverride = "1";
    if (o.hidden) {
      el.style.display = "none";
      return;
    } else {
      el.style.removeProperty("display");
    }
    if (o.text_content != null && el.dataset.editKind !== "image") {
      el.textContent = o.text_content;
    }
    if (o.image_url && el.tagName === "IMG") {
      el.src = o.image_url;
      // Ensure sibling initials placeholder doesn't take over
      el.style.display = "";
      const initials = el.parentElement?.querySelector(".team-initials");
      if (initials) initials.style.display = "none";
    }
    applyStyle(el, o.style || {});
  }

  function applyInsert(o) {
    const existing = document.querySelector(
      `[data-edit-id="${cssEscape(o.edit_id)}"]`,
    );
    let parent = null;
    if (o.slide_key) parent = document.getElementById(o.slide_key);
    if (o.parent_selector) parent = document.querySelector(o.parent_selector) || parent;
    if (!parent) return;
    let node = existing;
    if (!node) {
      if (o.element_type === "image") {
        node = document.createElement("img");
        node.alt = "";
      } else {
        node = document.createElement("div");
      }
      node.dataset.editId = o.edit_id;
      node.dataset.editKind = o.element_type || "text";
      node.dataset.inserted = "1";
      node.style.position = "absolute";
      // Default z-index 10 (in front). Only override if a nonzero z_index provided.
      node.style.zIndex = String(o.z_index && o.z_index !== 0 ? o.z_index : 10);
      // Visible fallback so a broken/missing image is still findable and clickable.
      if (o.element_type === "image") {
        node.style.minWidth = "40px";
        node.style.minHeight = "40px";
        node.style.outline = "1px dashed rgba(181,148,16,0.35)";
      }
      parent.appendChild(node);
    }
    if (o.hidden) {
      node.style.display = "none";
      return;
    } else {
      node.style.display = "";
    }
    if (o.element_type === "image" && o.image_url) {
      node.src = o.image_url;
      node.onload = () => { node.style.outline = ""; };
      node.onerror = () => {
        node.style.outline = "2px dashed #ff4d4d";
        console.warn("[deck-overlay] image failed to load:", o.image_url);
      };
    }
    if (o.element_type === "text" && o.text_content != null)
      node.textContent = o.text_content;
    applyStyle(node, o.style || {});
  }


  const ALLOWED_STYLE_PROPS = [
    "color",
    "background",
    "backgroundColor",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "fontFamily",
    "textAlign",
    "letterSpacing",
    "lineHeight",
    "opacity",
    "left",
    "top",
    "right",
    "bottom",
    "width",
    "height",
    "transform",
    "borderRadius",
    "padding",
    "margin",
    "zIndex",
    "textTransform",
  ];

  const IMPORTANT_PROPS = new Set(["width", "height", "left", "top", "right", "bottom", "transform", "zIndex"]);

  function applyStyle(el, style) {
    ALLOWED_STYLE_PROPS.forEach((p) => {
      if (style[p] != null && style[p] !== "") {
        const cssName = cssPropName(p);
        if (IMPORTANT_PROPS.has(p)) {
          el.style.setProperty(cssName, String(style[p]), "important");
        } else {
          el.style[p] = style[p];
        }
      } else if (el.dataset.hasStyle && el.dataset.hasStyle.includes(p)) {
        el.style.removeProperty(cssPropName(p));
      }
    });
    const keys = ALLOWED_STYLE_PROPS.filter(
      (p) => style[p] != null && style[p] !== "",
    );
    el.dataset.hasStyle = keys.join(",");
  }

  function cssPropName(camel) {
    return camel.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
  }

  function cssEscape(s) {
    return String(s).replace(/(["\\])/g, "\\$1");
  }

  async function fetchOverrides() {
    try {
      const url = `${SUPABASE_URL}/rest/v1/deck_overrides?deck_slug=eq.${DECK_SLUG}&select=*`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn("[deck-overlay] fetch failed", e);
      return [];
    }
  }

  async function applyAll() {
    const overrides = await fetchOverrides();
    window.__deckOverrides = overrides;
    overrides.forEach(applyOverride);
    window.dispatchEvent(
      new CustomEvent("deck-overrides-applied", { detail: { overrides } }),
    );
  }

  function boot() {
    // Ensure each slide creates its own stacking context so inserted images
    // with negative z-index render behind other slide content but not the page.
    const iso = document.createElement("style");
    iso.textContent = ".scene { isolation: isolate; }";
    document.head.appendChild(iso);
    tagElements();
    applyAll();

    // Expose helpers for the editor script
    window.__deck = {
      tagElements,
      applyOverride,
      applyStyle,
      fetchOverrides,
      applyAll,
      allowedStyle: ALLOWED_STYLE_PROPS,
    };
    // If we are inside an editor iframe, load the editor script.
    if (
      window.location.search.includes("edit=1") ||
      window.self !== window.top
    ) {
      // Only actually enable editing when explicitly requested
      if (window.location.search.includes("edit=1")) {
        const s = document.createElement("script");
        s.src = "/catalystdeck-editor.js";
        document.body.appendChild(s);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
