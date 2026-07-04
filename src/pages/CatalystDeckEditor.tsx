import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { ArrowLeft, Trash2, RotateCcw, Upload, Plus, Eye } from "lucide-react";

const DECK_SLUG = "catalyst";
const IFRAME_SRC = "/catalystdeck.html?edit=1";

type Override = {
  id?: string;
  deck_slug: string;
  edit_id: string;
  kind: "override" | "insert";
  slide_key?: string | null;
  parent_selector?: string | null;
  element_type?: "text" | "image" | null;
  text_content?: string | null;
  image_url?: string | null;
  style: Record<string, string>;
  hidden: boolean;
  z_index: number;
};

type ComputedStyle = Record<string, string>;

type Selection = {
  editId: string;
  kind: "text" | "image";
  text: string;
  src: string | null;
  override: Override | null;
  computed: ComputedStyle;
} | null;

type Scene = { id: string; label: string };

const FONT_FAMILIES = [
  { label: "Cormorant Garamond (serif)", value: "'Cormorant Garamond', serif" },
  { label: "Playfair Display (serif)", value: "'Playfair Display', serif" },
  { label: "Inter (sans)", value: "'Inter', sans-serif" },
  { label: "System sans", value: "system-ui, sans-serif" },
  { label: "Georgia (serif)", value: "Georgia, serif" },
  { label: "Times (serif)", value: "'Times New Roman', Times, serif" },
  { label: "Helvetica (sans)", value: "Helvetica, Arial, sans-serif" },
  { label: "Courier (mono)", value: "'Courier New', monospace" },
];

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px", "48px", "56px", "64px", "72px", "96px", "1.5vw", "2vw", "2.5vw", "3vw", "4vw", "5vw"];
const FONT_WEIGHTS = ["300", "400", "500", "600", "700", "800", "900"];
const FONT_STYLES = ["normal", "italic"];
const TEXT_ALIGNS = ["left", "center", "right", "justify"];
const TEXT_TRANSFORMS = ["none", "uppercase", "lowercase", "capitalize"];
const LETTER_SPACINGS = ["normal", "0", "0.02em", "0.05em", "0.1em", "0.15em", "0.2em"];
const LINE_HEIGHTS = ["1", "1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.8", "2"];

export default function CatalystDeckEditor() {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useIsAdmin();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selection, setSelection] = useState<Selection>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    document.title = "Catalyst Deck — Editor";
  }, []);

  useEffect(() => {
    if (!isLoading && !isAdmin) navigate("/catalystdeck", { replace: true });
  }, [isAdmin, isLoading, navigate]);

  // Receive messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data;
      if (!msg || msg.source !== "deck-editor") return;
      if (msg.type === "ready") {
        setScenes(msg.scenes || []);
      } else if (msg.type === "selected") {
        if (!msg.editId) {
          setSelection(null);
        } else {
          setSelection({
            editId: msg.editId,
            kind: msg.kind,
            text: msg.text,
            src: msg.src,
            override: msg.override,
            computed: msg.computed || {},
          });
        }
      } else if (msg.type === "text-edited") {
        saveOverride(msg.editId, { text_content: msg.text });
      } else if (msg.type === "style-changed") {
        const current = selectionRef.current?.override?.style || {};
        saveOverride(msg.editId, { style: { ...current, ...msg.style } });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ref mirror so message handler always sees latest selection
  const selectionRef = useRef<Selection>(null);
  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  const post = (msg: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(
      { source: "deck-editor-parent", ...msg },
      "*",
    );
  };

  const saveOverride = async (
    editId: string,
    patch: Partial<Override>,
    opts?: { silent?: boolean },
  ) => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("deck_overrides")
        .select("*")
        .eq("deck_slug", DECK_SLUG)
        .eq("edit_id", editId)
        .maybeSingle();
      const base: Override = existing
        ? (existing as unknown as Override)
        : {
            deck_slug: DECK_SLUG,
            edit_id: editId,
            kind: "override",
            style: {},
            hidden: false,
            z_index: 0,
          };
      const merged: Override = {
        ...base,
        ...patch,
        style: { ...(base.style || {}), ...(patch.style || {}) },
      };
      const { data, error } = await supabase
        .from("deck_overrides")
        .upsert(merged, { onConflict: "deck_slug,edit_id" })
        .select()
        .single();
      if (error) throw error;
      post({ type: "apply-override", override: data });
      // update local selection cache
      if (selectionRef.current?.editId === editId) {
        setSelection((s) => (s ? { ...s, override: data as unknown as Override } : s));
      }
      if (!opts?.silent) toast.success("Saved");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Save failed: " + msg);
    } finally {
      setSaving(false);
    }
  };

  const resetOverride = async (editId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("deck_overrides")
        .delete()
        .eq("deck_slug", DECK_SLUG)
        .eq("edit_id", editId);
      if (error) throw error;
      post({ type: "reload-overrides" });
      setSelection((s) => (s ? { ...s, override: null } : s));
      toast.success("Reset to original");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Reset failed: " + msg);
    } finally {
      setSaving(false);
    }
  };

  const hideElement = () => {
    if (!selection) return;
    saveOverride(selection.editId, { hidden: true });
  };

  const showElement = () => {
    if (!selection) return;
    saveOverride(selection.editId, { hidden: false });
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `deck/${DECK_SLUG}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!selection) return;
    try {
      const url = await uploadImage(file);
      await saveOverride(selection.editId, { image_url: url });
      setSelection((s) => (s ? { ...s, src: url } : s));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Upload failed: " + msg);
    }
  };

  const addTextElement = async () => {
    const active = getActiveScene();
    if (!active) {
      toast.error("Scroll to a slide first");
      return;
    }
    const editId = `insert::${active}::${crypto.randomUUID().slice(0, 8)}`;
    await saveOverride(editId, {
      kind: "insert",
      element_type: "text",
      slide_key: active,
      text_content: "New text",
      style: {
        left: "10%",
        top: "10%",
        color: "#fff",
        fontSize: "24px",
        fontFamily: "'Cormorant Garamond', serif",
      },
    });
    setTimeout(() => post({ type: "focus-edit-id", editId }), 300);
  };

  const addImageElement = async (file: File) => {
    const active = getActiveScene();
    if (!active) {
      toast.error("Scroll to a slide first");
      return;
    }
    try {
      const url = await uploadImage(file);
      const editId = `insert::${active}::${crypto.randomUUID().slice(0, 8)}`;
      await saveOverride(editId, {
        kind: "insert",
        element_type: "image",
        slide_key: active,
        image_url: url,
        z_index: 10,
        style: { left: "30%", top: "30%", width: "40%", height: "auto" },
      });
      toast.success("Image added — drag it into place");
      setTimeout(() => post({ type: "focus-edit-id", editId }), 400);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Add image failed: " + msg);
    }
  };

  const bringToFront = () => {
    if (!selection) return;
    const style = { ...(selection.override?.style || {}), zIndex: "50" };
    saveOverride(selection.editId, { style });
  };
  const sendToBack = () => {
    if (!selection) return;
    const style = { ...(selection.override?.style || {}), zIndex: "-1" };
    saveOverride(selection.editId, { style });
  };


  const getActiveScene = (): string | null => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return null;
      const scenes = Array.from(doc.querySelectorAll<HTMLElement>(".scene"));
      const scrollY = iframeRef.current!.contentWindow!.scrollY;
      const vh = iframeRef.current!.contentWindow!.innerHeight;
      let best = scenes[0]?.id || null;
      scenes.forEach((s) => {
        if (scrollY >= s.offsetTop - vh / 2) best = s.id;
      });
      return best;
    } catch {
      return null;
    }
  };

  const styleValue = (k: string) => selection?.override?.style?.[k] || "";

  if (isLoading) return <div className="p-8 text-white">Loading…</div>;
  if (!isAdmin) return null;

  return (
    <div className="fixed inset-0 flex flex-col bg-neutral-950 text-white">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-900 px-4 py-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/catalystdeck")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Exit
        </Button>
        <div className="mx-2 h-6 w-px bg-neutral-800" />
        <Button variant="ghost" size="sm" onClick={addTextElement}>
          <Plus className="mr-1 h-4 w-4" /> Add text
        </Button>
        <label>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) addImageElement(f);
              e.target.value = "";
            }}
          />
          <span className="inline-flex cursor-pointer items-center rounded-md px-3 py-2 text-sm hover:bg-neutral-800">
            <Plus className="mr-1 h-4 w-4" /> Add image
          </span>
        </label>
        <div className="mx-2 h-6 w-px bg-neutral-800" />
        <a
          href="/catalystdeck"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-md px-3 py-2 text-sm hover:bg-neutral-800"
        >
          <Eye className="mr-1 h-4 w-4" /> Preview
        </a>
        <div className="ml-auto text-xs text-neutral-400">
          {saving ? "Saving…" : "Saved"}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Slide list */}
        <div className="w-48 shrink-0 overflow-y-auto border-r border-neutral-800 bg-neutral-900 p-2">
          <div className="mb-2 px-2 text-[10px] uppercase tracking-widest text-neutral-500">
            Slides
          </div>
          {scenes.map((s, i) => (
            <button
              key={s.id}
              onClick={() => post({ type: "scroll-to", sceneId: s.id })}
              className="mb-1 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-neutral-800"
            >
              <span className="w-6 text-neutral-500">{String(i + 1).padStart(2, "0")}</span>
              <span className="truncate">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Iframe */}
        <div className="relative flex-1 overflow-hidden bg-black">
          <iframe
            ref={iframeRef}
            src={IFRAME_SRC}
            title="Catalyst Deck (edit mode)"
            className="h-full w-full border-0"
          />
        </div>

        {/* Inspector */}
        <div className="w-80 shrink-0 overflow-y-auto border-l border-neutral-800 bg-neutral-900 p-4">
          <div className="mb-2 text-[10px] uppercase tracking-widest text-neutral-500">
            Inspector
          </div>
          {!selection ? (
            <div className="rounded border border-dashed border-neutral-800 p-4 text-sm text-neutral-500">
              Click any element in the deck to edit it.
              <div className="mt-3 text-xs text-neutral-600">
                Tips:
                <ul className="mt-1 list-disc pl-4">
                  <li>Double-click text to edit inline</li>
                  <li>Drag a selected element to move it</li>
                  <li>Use style fields for color, size, etc.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded bg-neutral-800 px-2 py-1 font-mono text-[10px] text-neutral-400">
                {selection.editId}
              </div>

              {selection.kind === "text" && (
                <div>
                  <Label className="text-xs">Text</Label>
                  <Textarea
                    className="mt-1 min-h-[80px] bg-neutral-800 text-white"
                    defaultValue={selection.override?.text_content ?? selection.text}
                    key={selection.editId + "-text"}
                    onBlur={(e) => {
                      const v = e.target.value;
                      if (v !== (selection.override?.text_content ?? selection.text)) {
                        saveOverride(selection.editId, { text_content: v });
                      }
                    }}
                  />
                  <div className="mt-1 text-[10px] text-neutral-500">
                    Blur (click away) to save. Or double-click in the deck to edit inline.
                  </div>
                </div>
              )}

              {selection.kind === "image" && (
                <div>
                  <Label className="text-xs">Image URL</Label>
                  <Input
                    className="mt-1 bg-neutral-800 text-white"
                    defaultValue={selection.override?.image_url ?? selection.src ?? ""}
                    key={selection.editId + "-img"}
                    onBlur={(e) => {
                      const v = e.target.value;
                      if (v && v !== (selection.override?.image_url ?? selection.src)) {
                        saveOverride(selection.editId, { image_url: v });
                      }
                    }}
                  />
                  <label className="mt-2 block">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleImageUpload(f);
                        e.target.value = "";
                      }}
                    />
                    <span className="inline-flex cursor-pointer items-center rounded-md bg-neutral-800 px-3 py-2 text-xs hover:bg-neutral-700">
                      <Upload className="mr-1 h-3 w-3" />
                      {uploading ? "Uploading…" : "Upload replacement"}
                    </span>
                  </label>
                </div>
              )}

              <StyleInspector
                selection={selection}
                onChange={(key, value) => {
                  const nextStyle = { ...(selection.override?.style || {}) };
                  if (value === "" || value == null) delete nextStyle[key];
                  else nextStyle[key] = value;
                  saveOverride(selection.editId, { style: nextStyle });
                }}
              />


              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="secondary" onClick={bringToFront} title="z-index: 50">
                  Bring to front
                </Button>
                <Button size="sm" variant="secondary" onClick={sendToBack} title="z-index: -1 (behind text)">
                  Send to back
                </Button>
                {selection.override?.hidden ? (
                  <Button size="sm" variant="secondary" onClick={showElement}>
                    <Eye className="mr-1 h-4 w-4" /> Show
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={hideElement}>
                    <Trash2 className="mr-1 h-4 w-4" /> Hide
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => resetOverride(selection.editId)}
                  disabled={!selection.override}
                >
                  <RotateCcw className="mr-1 h-4 w-4" /> Reset
                </Button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- Style Inspector ----------------

type StyleInspectorProps = {
  selection: NonNullable<Selection>;
  onChange: (key: string, value: string) => void;
};

function parsePx(v: string | undefined): number | null {
  if (!v) return null;
  const m = v.match(/^(-?\d*\.?\d+)px$/);
  return m ? parseFloat(m[1]) : null;
}

function normalizeColor(v: string | undefined): string {
  if (!v) return "";
  if (v.startsWith("#")) return v;
  const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return "";
  const h = (n: string) => Number(n).toString(16).padStart(2, "0");
  return "#" + h(m[1]) + h(m[2]) + h(m[3]);
}

function Row({
  label,
  current,
  overridden,
  children,
}: {
  label: string;
  current?: string;
  overridden?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1 rounded border border-neutral-800 bg-neutral-950/50 p-2">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wider text-neutral-400">
          {label}
          {overridden && <span className="ml-1 text-amber-400">•</span>}
        </div>
        {current && (
          <div
            className="truncate font-mono text-[10px] text-neutral-300"
            title={current}
          >
            {current}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function DropdownWithCustom({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const isKnown = options.includes(value);
  return (
    <div className="flex gap-1">
      <Select value={isKnown ? value : ""} onValueChange={onChange}>
        <SelectTrigger className="h-8 flex-1 bg-neutral-800 text-xs text-white">
          <SelectValue placeholder={value || placeholder || "Choose…"} />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {options.map((o) => (
            <SelectItem key={o} value={o} className="text-xs">
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        className="h-8 w-24 bg-neutral-800 text-xs text-white"
        placeholder="custom"
        defaultValue={isKnown ? "" : value}
        key={value}
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v && v !== value) onChange(v);
        }}
      />
    </div>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const hex = normalizeColor(value) || "#000000";
  return (
    <div className="flex gap-1">
      <input
        type="color"
        value={hex}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 shrink-0 cursor-pointer rounded border border-neutral-700 bg-neutral-800"
      />
      <Input
        className="h-8 flex-1 bg-neutral-800 text-xs text-white"
        defaultValue={value}
        key={value}
        placeholder="#hex, rgba(), transparent"
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v !== value) onChange(v);
        }}
      />
    </div>
  );
}

function StyleInspector({ selection, onChange }: StyleInspectorProps) {
  const styleV = (k: string) => selection.override?.style?.[k] || "";
  const computedV = (k: string) => selection.computed?.[k] || "";
  // Effective = user override if present, otherwise what the browser is actually rendering.
  const eff = (k: string) => styleV(k) || computedV(k);
  const isOverridden = (k: string) => !!styleV(k);

  const opacityNum = parseFloat(eff("opacity") || "1");
  const effFontSizePx = parsePx(eff("fontSize"));

  return (
    <div className="space-y-2">
      <Label className="text-xs">Style</Label>
      <div className="text-[10px] text-neutral-500">
        Values shown are the element's current rendered style. Amber dot = overridden.
      </div>

      {selection.kind === "text" && (
        <Row label="Text color" current={eff("color")} overridden={isOverridden("color")}>
          <ColorPicker value={eff("color")} onChange={(v) => onChange("color", v)} />
        </Row>
      )}

      <Row label="Background" current={eff("backgroundColor")} overridden={isOverridden("backgroundColor")}>
        <ColorPicker value={eff("backgroundColor")} onChange={(v) => onChange("backgroundColor", v)} />
      </Row>

      {selection.kind === "text" && (
        <>
          <Row label="Font family" current={eff("fontFamily")} overridden={isOverridden("fontFamily")}>
            <Select value={eff("fontFamily")} onValueChange={(v) => onChange("fontFamily", v)}>
              <SelectTrigger className="h-8 bg-neutral-800 text-xs text-white">
                <SelectValue placeholder={eff("fontFamily") || "Inherit"} />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-xs" style={{ fontFamily: f.value }}>
                    {f.label}
                  </SelectItem>
                ))}
                {eff("fontFamily") && !FONT_FAMILIES.some((f) => f.value === eff("fontFamily")) && (
                  <SelectItem value={eff("fontFamily")} className="text-xs">
                    {eff("fontFamily")}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </Row>

          <Row
            label={`Font size${effFontSizePx ? ` — ${effFontSizePx}px` : ""}`}
            current={eff("fontSize")}
            overridden={isOverridden("fontSize")}
          >
            {effFontSizePx !== null ? (
              <div className="flex items-center gap-2">
                <Slider
                  min={8}
                  max={160}
                  step={1}
                  value={[effFontSizePx]}
                  onValueChange={(v) => onChange("fontSize", `${v[0]}px`)}
                  className="flex-1"
                />
                <Input
                  className="h-8 w-20 bg-neutral-800 text-xs text-white"
                  defaultValue={eff("fontSize")}
                  key={eff("fontSize")}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== eff("fontSize")) onChange("fontSize", v);
                  }}
                />
              </div>
            ) : (
              <DropdownWithCustom value={eff("fontSize")} options={FONT_SIZES} onChange={(v) => onChange("fontSize", v)} />
            )}
          </Row>

          <Row label="Font weight" current={eff("fontWeight")} overridden={isOverridden("fontWeight")}>
            <DropdownWithCustom value={eff("fontWeight")} options={FONT_WEIGHTS} onChange={(v) => onChange("fontWeight", v)} />
          </Row>

          <Row label="Font style" current={eff("fontStyle")} overridden={isOverridden("fontStyle")}>
            <DropdownWithCustom value={eff("fontStyle")} options={FONT_STYLES} onChange={(v) => onChange("fontStyle", v)} />
          </Row>

          <Row label="Text align" current={eff("textAlign")} overridden={isOverridden("textAlign")}>
            <DropdownWithCustom value={eff("textAlign")} options={TEXT_ALIGNS} onChange={(v) => onChange("textAlign", v)} />
          </Row>

          <Row label="Text transform" current={eff("textTransform")} overridden={isOverridden("textTransform")}>
            <DropdownWithCustom value={eff("textTransform")} options={TEXT_TRANSFORMS} onChange={(v) => onChange("textTransform", v)} />
          </Row>

          <Row label="Letter spacing" current={eff("letterSpacing")} overridden={isOverridden("letterSpacing")}>
            <DropdownWithCustom value={eff("letterSpacing")} options={LETTER_SPACINGS} onChange={(v) => onChange("letterSpacing", v)} />
          </Row>

          <Row label="Line height" current={eff("lineHeight")} overridden={isOverridden("lineHeight")}>
            <DropdownWithCustom value={eff("lineHeight")} options={LINE_HEIGHTS} onChange={(v) => onChange("lineHeight", v)} />
          </Row>
        </>
      )}

      <Row label={`Opacity — ${opacityNum.toFixed(2)}`} current={eff("opacity")} overridden={isOverridden("opacity")}>
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={[opacityNum]}
          onValueChange={(v) => onChange("opacity", String(v[0]))}
        />
      </Row>

      <Row label="Width" current={eff("width")} overridden={isOverridden("width")}>
        <Input
          className="h-8 bg-neutral-800 text-xs text-white"
          defaultValue={eff("width")}
          key={selection.editId + "-w"}
          placeholder="e.g. 300px, 50%"
          onBlur={(e) => onChange("width", e.target.value.trim())}
        />
      </Row>

      <Row label="Height" current={eff("height")} overridden={isOverridden("height")}>
        <Input
          className="h-8 bg-neutral-800 text-xs text-white"
          defaultValue={eff("height")}
          key={selection.editId + "-h"}
          placeholder="e.g. 200px, auto"
          onBlur={(e) => onChange("height", e.target.value.trim())}
        />
      </Row>

      <Row label="Padding" current={eff("padding")} overridden={isOverridden("padding")}>
        <Input
          className="h-8 bg-neutral-800 text-xs text-white"
          defaultValue={eff("padding")}
          key={selection.editId + "-p"}
          placeholder="e.g. 12px 24px"
          onBlur={(e) => onChange("padding", e.target.value.trim())}
        />
      </Row>

      <Row label="Border radius" current={eff("borderRadius")} overridden={isOverridden("borderRadius")}>
        <Input
          className="h-8 bg-neutral-800 text-xs text-white"
          defaultValue={eff("borderRadius")}
          key={selection.editId + "-br"}
          placeholder="e.g. 8px"
          onBlur={(e) => onChange("borderRadius", e.target.value.trim())}
        />
      </Row>

      <Row label="Transform" current={eff("transform")} overridden={isOverridden("transform")}>
        <Input
          className="h-8 bg-neutral-800 text-xs text-white"
          defaultValue={eff("transform")}
          key={selection.editId + "-tf"}
          placeholder="translate(0,0) rotate(0deg)"
          onBlur={(e) => onChange("transform", e.target.value.trim())}
        />
      </Row>

      <Row label="z-index" current={eff("zIndex")} overridden={isOverridden("zIndex")}>
        <Input
          className="h-8 bg-neutral-800 text-xs text-white"
          defaultValue={eff("zIndex")}
          key={selection.editId + "-z"}
          placeholder="10"
          onBlur={(e) => onChange("zIndex", e.target.value.trim())}
        />
      </Row>
    </div>
  );
}

