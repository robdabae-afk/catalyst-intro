import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";

/** /i/:code — referral links land here, remember the code, then go to signup */
export default function InviteLanding() {
  const { code = "" } = useParams();
  const clean = code.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
  useEffect(() => { if (clean) try { localStorage.setItem("catalyst.ref", clean); } catch { /* private mode */ } }, [clean]);
  return <Navigate to={clean ? `/signup?ref=${encodeURIComponent(clean)}` : "/signup"} replace />;
}
