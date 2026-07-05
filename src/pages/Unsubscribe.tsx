import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<"loading" | "ready" | "done" | "used" | "invalid" | "error">("loading");
  const [email, setEmail] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    (async () => {
      try {
        const res = await fetch(`${FN_URL}?token=${encodeURIComponent(token)}`, {
          headers: { apikey: ANON },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setState("invalid"); return; }
        if (data.used_at) { setState("used"); return; }
        setEmail(data.email || "");
        setState("ready");
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: ANON },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) { setState("error"); return; }
      setState("done");
    } catch {
      setState("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
        <h1 className="font-serif text-2xl mb-4">Unsubscribe</h1>
        {state === "loading" && <p className="text-muted-foreground">Verifying…</p>}
        {state === "invalid" && <p className="text-muted-foreground">This unsubscribe link is invalid or expired.</p>}
        {state === "used" && <p className="text-muted-foreground">You're already unsubscribed.</p>}
        {state === "error" && <p className="text-destructive">Something went wrong. Please try again.</p>}
        {state === "ready" && (
          <>
            <p className="text-muted-foreground mb-6">
              Stop sending emails to {email ? <strong>{email}</strong> : "this address"}?
            </p>
            <Button onClick={confirm} disabled={submitting} className="w-full">
              {submitting ? "Unsubscribing…" : "Confirm unsubscribe"}
            </Button>
          </>
        )}
        {state === "done" && <p className="text-muted-foreground">You've been unsubscribed. You won't receive these emails anymore.</p>}
      </div>
    </div>
  );
}
