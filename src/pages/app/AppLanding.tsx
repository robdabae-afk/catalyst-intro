import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, FileSignature, Lock } from "lucide-react";
import catalystLogo from "@/assets/catalyst-logo.png.asset.json";

const TrustRow = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <div className="flex items-start gap-3 px-4 py-3 border-b border-[#1a1a1a] last:border-b-0">
    <div className="w-8 h-8 rounded-[10px] bg-[#1a1a1a] flex items-center justify-center shrink-0">
      <span className="text-[#888]">{icon}</span>
    </div>
    <div className="text-xs text-[#666] leading-relaxed">
      <strong className="block text-[13px] text-[#bbb] font-semibold">{title}</strong>
      {desc}
    </div>
  </div>
);

export default function AppLanding() {
  const navigate = useNavigate();
  const [playIntro, setPlayIntro] = useState(() => {
    if (typeof window === "undefined") return false;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return false;
    return !sessionStorage.getItem("catalyst:introPlayed");
  });

  useEffect(() => {
    if (playIntro) {
      const t = setTimeout(() => {
        sessionStorage.setItem("catalyst:introPlayed", "1");
        setPlayIntro(false);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [playIntro]);

  return (
    <div className="h-screen overflow-hidden bg-black text-white flex flex-col items-center px-5 py-6 relative">
      <style>{`
        @keyframes catalyst-logo-intro {
          0%   { transform: translate(-50%, -50%) scale(6); opacity: 0; }
          25%  { opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes catalyst-logo-settle {
          0%   { opacity: 0; transform: translateY(-6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes catalyst-content-reveal {
          0%   { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes catalyst-logo-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        .catalyst-intro-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          pointer-events: none;
          background: #000;
        }
        .catalyst-intro-overlay img {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 140px;
          transform: translate(-50%, -50%) scale(6);
          opacity: 0;
          animation: catalyst-logo-intro 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .catalyst-overlay-fade {
          animation: fade-out 0.35s ease-out 1.4s forwards;
        }
        @keyframes fade-out {
          to { opacity: 0; }
        }
        .catalyst-logo-rest {
          animation: catalyst-logo-settle 0.5s cubic-bezier(0.16, 1, 0.3, 1) 1.35s both,
                     catalyst-logo-float 4.5s ease-in-out 2s infinite;
        }
        .catalyst-logo-rest-static {
          animation: catalyst-logo-float 4.5s ease-in-out infinite;
        }
        .catalyst-reveal {
          opacity: 0;
          animation: catalyst-content-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.5s forwards;
        }
      `}</style>

      {playIntro && (
        <div className="catalyst-intro-overlay catalyst-overlay-fade" aria-hidden>
          <img src={catalystLogo.url} alt="" draggable={false} />
        </div>
      )}

      <div className="w-full max-w-[400px] flex-1 flex flex-col min-h-0">
        <div className="text-center mt-4 mb-6">
          <img
            src={catalystLogo.url}
            alt="Catalyst"
            className={`w-[140px] mx-auto block select-none ${
              playIntro ? "catalyst-logo-rest" : "catalyst-logo-rest-static"
            }`}
            draggable={false}
          />
          <div className={`text-sm text-[#666] -mt-2 leading-snug ${playIntro ? "catalyst-reveal" : ""}`}>
            Vetted early-stage startup opportunities, built for everyday investors.
          </div>
        </div>

        <div className={`border border-[#1a1a1a] rounded-2xl overflow-hidden mb-auto ${playIntro ? "catalyst-reveal" : ""}`}>
          <TrustRow
            icon={<ShieldCheck className="w-4 h-4" />}
            title="Vetted opportunities"
            desc="Early-stage startups reviewed for everyday and professional investors"
          />
          <TrustRow
            icon={<FileSignature className="w-4 h-4" />}
            title="Clear deal information"
            desc="Founder profiles, company details, and key materials in one place"
          />
          <TrustRow
            icon={<Lock className="w-4 h-4" />}
            title="Private-market access"
            desc="Built to make startup investing easier to discover, understand, and evaluate"
          />
        </div>

        <div className={`pt-8 pb-2 ${playIntro ? "catalyst-reveal" : ""}`}>
          <button
            onClick={() => navigate("/app/signup")}
            className="w-full py-[15px] rounded-2xl bg-white text-black font-semibold text-[15px] tracking-tight active:opacity-85 transition-opacity"
          >
            Get started
          </button>
          <button
            onClick={() => navigate("/auth")}
            className="w-full py-3 mt-2 text-[13px] text-[#666] active:text-[#999]"
          >
            Already have an account
          </button>
        </div>
      </div>
    </div>
  );
}
