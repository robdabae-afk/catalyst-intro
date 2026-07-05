import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const SLIDE_W = 1920;
const SLIDE_H = 1080;

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const waitForImages = async (doc: Document) => {
  const images = Array.from(doc.images);
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      });
    }),
  );
};

const finalizeAnimatedContent = (doc: Document) => {
  doc.querySelectorAll<HTMLElement>(".reveal").forEach((el) => {
    el.classList.add("in");
    el.style.opacity = "1";
    el.style.transform = "none";
    el.style.transition = "none";
  });

  doc.querySelectorAll<HTMLElement>(".count").forEach((el) => {
    const target = Number(el.dataset.target || "0");
    const suffix = el.dataset.suffix || "";
    el.textContent = `${Number.isInteger(target) ? Math.round(target).toLocaleString() : target.toLocaleString()}${suffix}`;
  });

  doc.querySelectorAll<SVGElement>(".cover-arrow path").forEach((path) => {
    path.style.strokeDashoffset = "0";
    path.style.animation = "none";
  });

  doc.querySelectorAll<HTMLElement>(".cover-arrow .head, .cover-divider, .cover-tagline").forEach((el) => {
    el.style.opacity = "1";
    el.style.animation = "none";
  });
};

export default function CatalystDeckExport() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState("Preparing deck…");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Catalyst Deck — Export PDF";
  }, []);

  useEffect(() => {
    let cancelled = false;

    const exportDeck = async () => {
      try {
        const iframe = iframeRef.current;
        if (!iframe) return;

        await new Promise<void>((resolve) => {
          if (iframe.contentDocument?.readyState === "complete") resolve();
          else iframe.addEventListener("load", () => resolve(), { once: true });
        });

        const win = iframe.contentWindow;
        const doc = iframe.contentDocument;
        if (!win || !doc) throw new Error("Unable to access deck frame.");

        setStatus("Loading fonts, images, and edits…");
        await Promise.race([
          new Promise<void>((resolve) => {
            if ((win as unknown as { __deckOverrides?: unknown }).__deckOverrides) resolve();
            else win.addEventListener("deck-overrides-applied", () => resolve(), { once: true });
          }),
          wait(5000),
        ]);

        await doc.fonts?.ready;
        finalizeAnimatedContent(doc);
        await waitForImages(doc);
        await wait(250);

        const scenes = Array.from(doc.querySelectorAll<HTMLElement>(".scene"));
        if (!scenes.length) throw new Error("No slides found to export.");

        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [SLIDE_W, SLIDE_H],
          compress: true,
          hotfixes: ["px_scaling"],
        });

        for (let index = 0; index < scenes.length; index += 1) {
          if (cancelled) return;
          const scene = scenes[index];
          scene.scrollIntoView();
          finalizeAnimatedContent(doc);
          await wait(100);

          setStatus(`Capturing slide ${index + 1} of ${scenes.length}…`);
          setProgress(Math.round((index / scenes.length) * 100));

          const canvas = await html2canvas(scene, {
            backgroundColor: "#000000",
            width: SLIDE_W,
            height: SLIDE_H,
            windowWidth: SLIDE_W,
            windowHeight: SLIDE_H,
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            scrollX: 0,
            scrollY: -scene.getBoundingClientRect().top,
          });

          if (index > 0) pdf.addPage([SLIDE_W, SLIDE_H], "landscape");
          const image = canvas.toDataURL("image/png");
          pdf.addImage(image, "PNG", 0, 0, SLIDE_W, SLIDE_H, undefined, "FAST");
        }

        if (cancelled) return;
        setStatus("Downloading PDF…");
        setProgress(100);
        pdf.save("Catalyst_Pitch_Deck.pdf");
        setStatus("PDF exported. You can close this tab.");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus("Export failed.");
      }
    };

    exportDeck();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
        <div className="space-y-4 border border-border bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Catalyst Deck</p>
          <h1 className="text-3xl font-semibold">Exporting PDF</h1>
          <p className="text-sm text-muted-foreground">{status}</p>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </section>
      <iframe
        ref={iframeRef}
        src="/catalystdeck.html?export=1"
        title="Catalyst Deck Export Source"
        style={{
          position: "fixed",
          left: "-10000px",
          top: 0,
          width: `${SLIDE_W}px`,
          height: `${SLIDE_H}px`,
          border: 0,
          pointerEvents: "none",
          visibility: "hidden",
        }}
      />
    </main>
  );
}