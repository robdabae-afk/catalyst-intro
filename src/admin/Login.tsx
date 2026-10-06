import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, errText, isSample, useSession } from "@/lib/platform/client";
import { SampleBanner, useTitle } from "./Layout";
import "./admin.css";

/** /app/login: real Supabase email/password via platform api (sample backend when the flag is off). */
export default function Login() {
  useTitle("Sign in");
  const [sp] = useSearchParams();
  const next = sp.get("next") || "/app/events";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/app/events";
  const nav = useNavigate();
  const { session } = useSession();
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [name, setName] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null); const [msg, setMsg] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(null); setMsg(null); setBusy(true);
    try {
      if (mode === "reset") { await api.sendReset(email); setMsg("If that email has an account, a reset link is on its way."); }
      else if (mode === "up") { const s = await api.signUp(email, pw, name); if (s) nav(safeNext); else setMsg("Check your email to confirm your account, then sign in."); }
      else { await api.signIn(email, pw); nav(safeNext); }
    } catch (x) { setErr(errText(x)); } finally { setBusy(false); }
  };
  return (
    <div className="ad" style={{ display: "block" }}>
      <SampleBanner />
      <div style={{ maxWidth: 400, margin: "10vh auto", padding: "0 20px" }} className="fade">
        <Link to="/" className="ad-logo" style={{ padding: 0, marginBottom: 32, display: "flex" }}>catalyst<i /></Link>
        <h1 style={{ fontSize: 32, letterSpacing: "-.04em", margin: "0 0 6px" }}>{mode === "up" ? "Create account" : mode === "reset" ? "Reset password" : "Sign in"}</h1>
        {session && <p className="note">Signed in as {session.email}. <button className="lnk" onClick={() => api.signOut()}>Sign out</button></p>}
        {isSample && <p className="note">Demo mode: any email works and stays on this device. No real account is created.</p>}
        <form className="f" onSubmit={submit} style={{ marginTop: 24 }}>
          {err && <div className="err" role="alert">{err}</div>}
          {msg && <div className="card" role="status">{msg}</div>}
          {mode === "up" && <label className="fl"><span className="lbl">Name</span><input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" /></label>}
          <label className="fl"><span className="lbl">Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
          {mode !== "reset" && <label className="fl"><span className="lbl">Password</span><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={mode === "up" ? 8 : 1} autoComplete={mode === "up" ? "new-password" : "current-password"} /></label>}
          <button className="b k" style={{ height: 46, justifyContent: "center" }} disabled={busy}>{busy ? "One sec…" : mode === "up" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}</button>
          <div className="ad-row note" style={{ justifyContent: "space-between" }}>
            {mode === "in" ? <><button type="button" className="lnk" onClick={() => setMode("up")}>Create an account</button><button type="button" className="lnk" onClick={() => setMode("reset")}>Forgot password</button></>
              : <button type="button" className="lnk" onClick={() => setMode("in")}>Back to sign in</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
