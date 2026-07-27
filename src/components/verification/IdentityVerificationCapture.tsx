import { useEffect, useRef, useState } from "react";
import { X, RotateCcw, Check, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { analyzeImageQuality, issueMessage, type ImageQualityResult } from "@/lib/imageQuality";
import { useIdentityVerification } from "@/hooks/useIdentityVerification";
import { useToast } from "@/hooks/use-toast";

type Stage = "intro" | "id-camera" | "id-check" | "selfie-camera" | "selfie-check" | "submitting";

interface CapturedShot {
  dataUrl: string;
  blob: Blob;
  quality: ImageQualityResult;
}

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string | null | undefined;
  onSubmitted: () => void;
}

export function IdentityVerificationCapture({ open, onClose, userId, onSubmitted }: Props) {
  const { toast } = useToast();
  const { submit } = useIdentityVerification(userId);
  const [stage, setStage] = useState<Stage>("intro");
  const [idShot, setIdShot] = useState<CapturedShot | null>(null);
  const [selfieShot, setSelfieShot] = useState<CapturedShot | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async (facingMode: "environment" | "user") => {
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Camera unavailable",
        description: "Please allow camera access to verify your identity.",
      });
    }
  };

  useEffect(() => {
    if (stage === "id-camera") startCamera("environment");
    if (stage === "selfie-camera") startCamera("user");
    if (stage !== "id-camera" && stage !== "selfie-camera") stopStream();
    return () => stopStream();
  }, [stage]);

  useEffect(() => {
    if (!open) {
      setStage("intro");
      setIdShot(null);
      setSelfieShot(null);
      stopStream();
    }
  }, [open]);

  const capture = (): CapturedShot | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    const quality = analyzeImageQuality(canvas);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    return { dataUrl, blob: dataURLtoBlob(dataUrl), quality };
  };

  const handleCaptureId = () => {
    const shot = capture();
    if (!shot) return;
    setIdShot(shot);
    setStage("id-check");
  };

  const handleCaptureSelfie = () => {
    const shot = capture();
    if (!shot) return;
    setSelfieShot(shot);
    setStage("selfie-check");
  };

  const handleSubmit = async () => {
    if (!idShot || !selfieShot) return;
    setSubmitting(true);
    setStage("submitting");
    const res = await submit(idShot.blob, selfieShot.blob);
    setSubmitting(false);
    if (!res.ok) {
      toast({ variant: "destructive", title: "Submission failed", description: res.error });
      setStage("selfie-check");
      return;
    }
    toast({ title: "Submitted for review", description: "We'll notify you once it's reviewed." });
    onSubmitted();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-center" style={{ background: "#060606" }}>
      <div className="relative w-full max-w-[430px] h-[100dvh] flex flex-col overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-14 right-5 z-20 icon-btn"
          aria-label="Close"
        >
          <X size={18} color="#F6F5F2" strokeWidth={2} />
        </button>

        {stage === "intro" && (
          <IntroScreen onStart={() => setStage("id-camera")} />
        )}

        {stage === "id-camera" && (
          <CameraScreen
            videoRef={videoRef}
            title="Photograph your ID"
            subtitle="Government-issued ID with your name and date of birth."
            overlay="rect"
            onCapture={handleCaptureId}
          />
        )}

        {stage === "id-check" && idShot && (
          <ReviewScreen
            shot={idShot}
            label="ID document"
            onRetake={() => {
              setIdShot(null);
              setStage("id-camera");
            }}
            onAccept={() => setStage("selfie-camera")}
          />
        )}

        {stage === "selfie-camera" && (
          <CameraScreen
            videoRef={videoRef}
            title="Take a selfie"
            subtitle="Fit your face inside the outline, in good lighting."
            overlay="oval"
            mirrored
            onCapture={handleCaptureSelfie}
          />
        )}

        {stage === "selfie-check" && selfieShot && (
          <ReviewScreen
            shot={selfieShot}
            label="Selfie"
            mirrored
            onRetake={() => {
              setSelfieShot(null);
              setStage("selfie-camera");
            }}
            onAccept={handleSubmit}
            acceptLabel="Submit for review"
          />
        )}

        {stage === "submitting" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Loader2 size={28} className="animate-spin" style={{ color: "#C6A02C" }} />
            <p style={{ color: "#94908A", fontSize: 14 }}>Submitting…</p>
          </div>
        )}
      </div>
    </div>
  );
}

function dataURLtoBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/* ---------- Sub-screens ---------- */

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(198, 160, 44, 0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 22,
        }}
      >
        <ShieldCheck size={28} style={{ color: "#C6A02C" }} />
      </div>
      <h1
        style={{
          color: "#F6F5F2",
          fontSize: 24,
          fontFamily: "Fraunces, serif",
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        Verify your identity
      </h1>
      <p style={{ color: "#94908A", fontSize: 13.5, lineHeight: 1.6, marginBottom: 28, maxWidth: 300 }}>
        You'll need a government-issued ID and your camera. We'll walk you through a photo of your
        ID, then a quick selfie. A team member reviews every submission manually.
      </p>
      <button
        onClick={onStart}
        style={{
          width: "100%",
          maxWidth: 300,
          height: 54,
          background: "#F6F5F2",
          borderRadius: 16,
          border: "none",
          cursor: "pointer",
          color: "#0A0A0C",
          fontSize: 15,
          fontWeight: 500,
        }}
      >
        Start verification
      </button>
    </div>
  );
}

function CameraScreen({
  videoRef,
  title,
  subtitle,
  overlay,
  mirrored,
  onCapture,
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  title: string;
  subtitle: string;
  overlay: "rect" | "oval";
  mirrored?: boolean;
  onCapture: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="px-6 pt-14 pb-4">
        <h2 style={{ color: "#F6F5F2", fontSize: 19, fontWeight: 600, fontFamily: "Fraunces, serif" }}>
          {title}
        </h2>
        <p style={{ color: "#94908A", fontSize: 12.5, marginTop: 4 }}>{subtitle}</p>
      </div>

      <div className="relative flex-1 mx-4 mb-4 rounded-3xl overflow-hidden" style={{ background: "#111" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={mirrored ? { transform: "scaleX(-1)" } : undefined}
        />

        {/* Guide overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {overlay === "rect" ? (
            <div
              style={{
                width: "82%",
                aspectRatio: "1.586",
                border: "2px dashed rgba(246,245,242,0.7)",
                borderRadius: 14,
              }}
            />
          ) : (
            <div
              style={{
                width: "62%",
                aspectRatio: "0.78",
                border: "2px dashed rgba(246,245,242,0.7)",
                borderRadius: "50%",
              }}
            />
          )}
        </div>
      </div>

      <div className="px-6 pb-10 flex justify-center">
        <button
          onClick={onCapture}
          aria-label="Capture"
          style={{
            width: 74,
            height: 74,
            borderRadius: "50%",
            background: "#FFFFFF",
            border: "5px solid rgba(255,255,255,0.25)",
            cursor: "pointer",
          }}
        />
      </div>
    </div>
  );
}

function ReviewScreen({
  shot,
  label,
  mirrored,
  onRetake,
  onAccept,
  acceptLabel = "Use this photo",
}: {
  shot: CapturedShot;
  label: string;
  mirrored?: boolean;
  onRetake: () => void;
  onAccept: () => void;
  acceptLabel?: string;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="px-6 pt-14 pb-4">
        <h2 style={{ color: "#F6F5F2", fontSize: 19, fontWeight: 600, fontFamily: "Fraunces, serif" }}>
          Review {label.toLowerCase()}
        </h2>
      </div>

      <div className="relative flex-1 mx-4 mb-4 rounded-3xl overflow-hidden" style={{ background: "#111" }}>
        <img
          src={shot.dataUrl}
          alt={label}
          className="absolute inset-0 w-full h-full object-cover"
          style={mirrored ? { transform: "scaleX(-1)" } : undefined}
        />
      </div>

      {!shot.quality.ok && (
        <div
          className="mx-4 mb-4 px-4 py-3 rounded-2xl flex items-start gap-3"
          style={{ background: "rgba(198,86,44,0.12)", border: "1px solid rgba(198,86,44,0.3)" }}
        >
          <AlertTriangle size={18} style={{ color: "#E79A6C", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ color: "#F6F5F2", fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
              This photo might not pass review
            </p>
            {shot.quality.issues.map((issue) => (
              <p key={issue} style={{ color: "#CFCCC5", fontSize: 12, lineHeight: 1.5 }}>
                {issueMessage(issue)}
              </p>
            ))}
            <p style={{ color: "#94908A", fontSize: 11.5, marginTop: 4 }}>
              We recommend retaking it in better light and holding steady.
            </p>
          </div>
        </div>
      )}

      <div className="px-6 pb-10 flex gap-3">
        <button
          onClick={onRetake}
          className="flex-1 flex items-center justify-center gap-2"
          style={{
            height: 54,
            borderRadius: 16,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.14)",
            color: "#F6F5F2",
            fontSize: 14.5,
            fontWeight: 500,
          }}
        >
          <RotateCcw size={16} /> Retake
        </button>
        <button
          onClick={onAccept}
          className="flex-1 flex items-center justify-center gap-2"
          style={{
            height: 54,
            borderRadius: 16,
            background: shot.quality.ok ? "#F6F5F2" : "rgba(246,245,242,0.7)",
            border: "none",
            color: "#0A0A0C",
            fontSize: 14.5,
            fontWeight: 500,
          }}
        >
          <Check size={16} /> {acceptLabel}
        </button>
      </div>
    </div>
  );
}
