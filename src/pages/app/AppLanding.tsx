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
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = catalystLogo.url;
    if (img.complete) {
      setLogoLoaded(true);
    } else {
      img.onload = () => setLogoLoaded(true);
      img.onerror = () => setLogoLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!logoLoaded) return;
    const id = requestAnimationFrame(() => setPlay(true));
    return () => cancelAnimationFrame(id);
  }, [logoLoaded]);

  return (
    <div className="relative h-screen overflow-hidden bg-black text-white flex flex-col items-center px-5 py-6">
      <style>{`
        @keyframes catalyst-logo-intro {
          0% {
            transform: translate(-50%, -50%) scale(8);
            opacity: 0;
            filter: blur(12px);
            top: 50vh;
          }
          25% { opacity: 1; filter: blur(0px); }
          55% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
            filter: blur(0px);
            top: 50vh;
          }
          100% {
            transform: translate(-50%, 0) scale(1);
            opacity: 1;
            filter: blur(0px);
            top: var(--logo-rest-top, 40px);
          }
        }
        @keyframes catalyst-logo-float {
          0%, 100% { transform: translate(-50%, 0) translateY(0); }
          50% { transform: translate(-50%, 0) translateY(-3px); }
        }
        @keyframes catalyst-content-reveal {
          0% { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes catalyst-placeholder-fade {
          0%, 100% { opacity: 0; }
        }
        .catalyst-logo-fly {
          position: absolute;
          left: 50%;
          width: 140px;
          z-index: 50;
          animation:
            catalyst-logo-intro 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards,
            catalyst-logo-float 4s ease-in-out 1.6s infinite;
          will-change: transform, top, opacity;
        }
        .catalyst-logo-placeholder {
          visibility: hidden;
        }
        .catalyst-reveal {
          opacity: 0;
          animation: catalyst-content-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .catalyst-reveal-1 { animation-delay: 1.15s; }
        .catalyst-reveal-2 { animation-delay: 1.25s; }
        .catalyst-reveal-3 { animation-delay: 1.35s; }
        @media (prefers-reduced-motion: reduce) {
          .catalyst-logo-fly {
            animation: none;
            position: static;
            transform: none;
          }
          .catalyst-logo-placeholder { display: none; }
          .catalyst-reveal { opacity: 1; animation: none; }
        }
      `}</style>

      {/* Flying logo overlay */}
      <img
        src={catalystLogo.url}
        alt="Catalyst"
        className="catalyst-logo-fly select-none"
        draggable={false}
        style={{ ["--logo-rest-top" as never]: "40px" }}
      />

      <div className="w-full max-w-[400px] flex-1 flex flex-col min-h-0">
        <div className="text-center mt-4 mb-6">
          {/* Placeholder reserves vertical space for the settled logo */}
          <img
            src={catalystLogo.url}
            alt=""
            aria-hidden="true"
            className="catalyst-logo-placeholder w-[140px] mx-auto block"
            draggable={false}
          />
          <div className="catalyst-reveal catalyst-reveal-1 text-sm text-[#666] -mt-2 leading-snug">
            Vetted early-stage startup opportunities, built for everyday investors.
          </div>
        </div>

        <div className="catalyst-reveal catalyst-reveal-2 border border-[#1a1a1a] rounded-2xl overflow-hidden mb-auto">
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

        <div className="catalyst-reveal catalyst-reveal-3 pt-8 pb-2">
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
