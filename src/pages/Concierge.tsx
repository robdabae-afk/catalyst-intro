import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Concierge() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-8 hover:bg-neutral-900 text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent w-fit">
            Concierge Services
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl">
            Premium support and tailored services to accelerate your journey.
            Select a service to get started.
          </p>
        </div>

        {/* Placeholder for the main component implementation */}
        <div className="mt-12 p-12 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/50 flex flex-col items-center justify-center text-center space-y-4">
          <p className="text-neutral-500">Concierge Services Coming Soon...</p>
          <p className="text-neutral-600 text-sm">We're working on bringing you premium services. Check back soon!</p>
        </div>
      </div>
    </div>
  );
}
