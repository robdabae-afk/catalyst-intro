import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Waitlist() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Waitlist — Catalyst";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Catalyst launches August 31st. Join the waitlist for early access.");
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <main className="max-w-lg w-full text-center space-y-8">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-[#888]">Catalyst</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Welcome — we launch August 31st!
          </h1>
          <p className="text-[15px] text-[#999] leading-relaxed">
            We're reviewing applications now for early access.
          </p>
        </div>

        <button
          onClick={() => navigate("/app/signup")}
          className="w-full py-[15px] rounded-2xl bg-white text-black font-semibold text-[15px] tracking-tight active:opacity-85 transition-opacity"
        >
          Sign up
        </button>

        <button
          onClick={() => navigate("/auth")}
          className="w-full py-3 text-[13px] text-[#666] active:text-[#999]"
        >
          Already have an account
        </button>
      </main>
    </div>
  );
}
