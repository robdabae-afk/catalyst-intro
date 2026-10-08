import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "@/features/features.css";
import "@/features/auth.css";

export default function Waitlist() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Waitlist — Catalyst";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Join the Catalyst waitlist for product updates. In-app investing is not available; funding portal registration is in process.");
  }, []);

  return (
    <div className="cf cf-ob">
      <div className="ob ob-auth ob-waitlist">
        <div className="ob-body">
          <div className="ob-head">
            <div className="ob-mark" aria-hidden><i /></div>
            <h1>Welcome, you're on the list!</h1>
            <p>We're reviewing applications now for early access.</p>
          </div>
          <div className="au-form">
            <button type="button" className="btn" onClick={() => navigate("/app/signup")}>Sign up</button>
            <button type="button" className="btn ghost" onClick={() => navigate("/auth")}>Already have an account</button>
          </div>
        </div>
      </div>
    </div>
  );
}
