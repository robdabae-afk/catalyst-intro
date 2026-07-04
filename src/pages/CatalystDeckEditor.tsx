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
    const url = await uploadImage(file);
    const editId = `insert::${active}::${crypto.randomUUID().slice(0, 8)}`;
    await saveOverride(editId, {
      kind: "insert",
      element_type: "image",
      slide_key: active,
      image_url: url,
      style: { left: "10%", top: "10%", width: "300px" },
    });
    setTimeout(() => post({ type: "focus-edit-id", editId }), 300);
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
