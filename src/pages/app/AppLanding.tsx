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
  return (
    <div className="h-screen overflow-hidden bg-black text-white flex flex-col items-center px-5 py-6">
      <div className="w-full max-w-[400px] flex-1 flex flex-col min-h-0">
        <div className="text-center mt-4 mb-6">
          <img
            src={catalystLogo.url}
            alt="Catalyst"
            className="w-[140px] mx-auto block select-none"
            draggable={false}
          />
          <div className="text-sm text-[#666] -mt-2 leading-snug">
            Vetted early-stage startup opportunities, built for everyday investors.
          </div>
        </div>


        <div className="border border-[#1a1a1a] rounded-2xl overflow-hidden mb-auto">
          <TrustRow
            icon={<ShieldCheck className="w-4 h-4" />}
            title="Identity verified"
            desc="Every profile reviewed before going live"
          />
          <TrustRow
            icon={<FileSignature className="w-4 h-4" />}
            title="Attorney-drafted SAFEs"
            desc="Sign and close in-app"
          />
          <TrustRow
            icon={<Lock className="w-4 h-4" />}
            title="Your data is never sold"
            desc="Private until you share it"
          />
        </div>

        <div className="pt-8 pb-2">
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
