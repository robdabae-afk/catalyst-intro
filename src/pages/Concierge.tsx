import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, FileText, Zap, Megaphone, TrendingUp, GlassWater, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type ServiceStage = 'intro' | 'budget' | 'reveal';

interface BudgetOption {
  id: string;
  label: string;
  price: number;
  stripeLink?: string;
  action?: 'stripe' | 'inquire';
  deposit?: boolean;
  description?: string;
}

interface ServiceData {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  budgets: BudgetOption[];
}

const SERVICES: ServiceData[] = [
  {
    id: 'investor-intros',
    title: 'Direct Investor Intros',
    icon: Users,
    description: 'Personalized warm intros to investors that match your industry and stage.',
    budgets: [
      { id: 'starter', label: '$150', price: 150, stripeLink: 'https://buy.stripe.com/eVq9AT136fEpfXteqi8k803', action: 'stripe', description: '1 Warm Intro + Tokens' },
      { id: 'growth', label: '$300', price: 300, stripeLink: 'https://buy.stripe.com/8x2cN5h241Nz26Daa28k804', action: 'stripe', description: '2-3 Warm Intros + Tokens' },
      { id: 'targeted', label: '$500 (Targeted)', price: 500, stripeLink: 'https://buy.stripe.com/28EaEXh24fEph1x81U8k805', action: 'stripe', description: '10 Targeted Intros + Tokens' },
      { id: 'broadcast', label: '$500 (Broadcast)', price: 500, stripeLink: 'https://buy.stripe.com/5kQbJ1cLOak526D5TM8k806', action: 'stripe', description: 'Investor Broadcast' },
      { id: 'lifetime', label: '$750', price: 750, action: 'inquire', description: 'Round Lifetime Access' },
    ]
  },
  {
    id: 'pitch-deck',
    title: 'Pitch Deck Revisions',
    icon: FileText,
    description: 'Narrative and design experts to help you nail your pitch and storytelling.',
    budgets: [
      { id: 'audit', label: '< $500', price: 399, stripeLink: 'https://buy.stripe.com/eVq4gzaDG1NzcLh2HA8k80a', action: 'stripe', description: 'Narrative Audit & Feedback' },
      { id: 'pro', label: '> $500', price: 4000, deposit: true, stripeLink: 'https://buy.stripe.com/eVq00jeTWbo95iPeqi8k80b', action: 'stripe', description: 'Full Redesign ($500 Deposit)' }
    ]
  },
  {
    id: 'profile-opt',
    title: 'Profile Optimization',
    icon: Zap,
    description: 'Maximize your profile\'s impact with professional bio rewrites.',
    budgets: [
      { id: 'essential', label: '$75', price: 75, stripeLink: 'https://buy.stripe.com/7sY14n5jm3VHdPl4PI8k80c', action: 'stripe', description: 'Bio/Tagline Makeover' },
      { id: 'pro_profile', label: '$200', price: 200, action: 'inquire', description: 'Pro Badge + Full Rewrite' }
    ]
  },
  {
    id: 'spotlights',
    title: 'Founder Spotlights',
    icon: Megaphone,
    description: 'Get featured in our 50k+ subscriber newsletter and social channels.',
    budgets: [
      { id: 'newsletter', label: '$150', price: 150, stripeLink: 'https://buy.stripe.com/6oUeVd9zCgIt26D95Y8k80d', action: 'stripe', description: 'Newsletter Feature' },
      { id: 'frontpage', label: '$200', price: 200, stripeLink: 'https://buy.stripe.com/4gM3cvaDG77TfXt4PI8k80e', action: 'stripe', description: 'Front Page + Social Blast' },
      { id: 'podcast_std', label: '< $300', price: 300, deposit: true, stripeLink: 'https://buy.stripe.com/3cIfZh8vy63P9z51Dw8k808', action: 'stripe', description: '25-min Podcast ($150 Deposit)' },
      { id: 'podcast_deep', label: '$300 - $500', price: 400, deposit: true, stripeLink: 'https://buy.stripe.com/fZucN59zC1Nz5iPaa28k809', action: 'stripe', description: '45-min Podcast ($250 Deposit)' },
      { id: 'podcast_inf', label: '> $500', price: 1000, action: 'inquire', description: 'Influencer Podcast' }
    ]
  },
  {
    id: 'investor-spotlights',
    title: 'Investor Spotlights',
    icon: TrendingUp,
    description: 'Promote your investment thesis to top-tier founders.',
    budgets: [
      { id: 'inv_spot', label: 'Contact Us', price: 0, action: 'inquire', description: 'Custom Package' }
    ]
  },
  {
    id: 'vip-events',
    title: 'VIP Event Access',
    icon: GlassWater,
    description: 'Priority access to exclusive demo days and dinners.',
    budgets: [
      { id: 'vip_club', label: '$99/mo', price: 99, action: 'inquire', description: 'All-Access Pass' }
    ]
  }
];

const ServiceCard = ({ service }: { service: ServiceData }) => {
  const [stage, setStage] = useState<ServiceStage>('intro');
  const [selectedBudget, setSelectedBudget] = useState<BudgetOption | null>(null);

  const handleBudgetClick = (budget: BudgetOption) => {
    setSelectedBudget(budget);
    setStage('reveal');
  };

  const currentPrice = selectedBudget?.price || 0;
  const hasTokenBonus = currentPrice >= 150;
  const tokenAmount = currentPrice > 400 ? 200 : 100;

  if (stage === 'intro') {
    return (
      <div className="p-6 rounded-xl bg-neutral-900/50 border border-neutral-800 hover:border-purple-500/50 hover:bg-neutral-900 transition-all duration-300">
        <div className="w-12 h-12 rounded-lg bg-neutral-800/50 flex items-center justify-center mb-6 border border-neutral-700/50">
          <service.icon className="w-6 h-6 text-purple-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">{service.title}</h3>
        <p className="text-neutral-400 leading-relaxed mb-6">{service.description}</p>
        <Button
          className="w-full bg-white text-black hover:bg-neutral-200 font-semibold"
          onClick={() => setStage('budget')}
        >
          Check Options
        </Button>
      </div>
    );
  }

  if (stage === 'budget') {
    return (
      <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 transition-all duration-300">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStage('intro')}
            className="text-neutral-400 hover:text-white mb-2"
          >
            ← Back
          </Button>
          <h4 className="text-lg font-semibold text-white text-center">
            What is your growth budget?
          </h4>
        </div>
        <div className="space-y-3">
          {service.budgets.map((budget) => (
            <Button
              key={budget.id}
              variant="outline"
              className="w-full justify-between bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700 hover:border-amber-500/50"
              onClick={() => handleBudgetClick(budget)}
            >
              <span>{budget.label}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-amber-500/30 relative transition-all duration-300">
      {hasTokenBonus && (
        <div className="absolute top-4 right-4">
          <span className="bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold px-3 py-1 rounded-full">
            ⚡ {tokenAmount} Tokens
          </span>
        </div>
      )}

      <div className="mb-8 mt-4">
        <div className="text-sm text-neutral-400 mb-2">Selected Package</div>
        <h3 className="text-2xl font-bold text-white mb-2">{selectedBudget?.description}</h3>
        <div className="text-3xl font-bold text-white">
          ${selectedBudget?.price}
          {selectedBudget?.deposit && <span className="text-sm text-neutral-500 ml-2">(Deposit)</span>}
        </div>
      </div>

      <div className="space-y-3">
        {selectedBudget?.action === 'stripe' ? (
          <Button
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold"
            onClick={() => window.open(selectedBudget.stripeLink, '_blank')}
          >
            Purchase Now
          </Button>
        ) : (
          <Button
            className="w-full bg-white hover:bg-neutral-200 text-black font-bold"
            onClick={() => {
              toast.success("We'll reach out shortly!");
              window.location.href = 'mailto:support@catalyst.com';
            }}
          >
            Contact Us
          </Button>
        )}

        <Button
          variant="ghost"
          className="w-full text-neutral-500 hover:text-white"
          onClick={() => setStage('budget')}
        >
          ← Back to Budgets
        </Button>
      </div>
    </div>
  );
};

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

        <div className="space-y-4 mb-16">
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-wider uppercase rounded-full inline-block">
            Concierge
          </span>
          <h1 className="text-5xl font-bold text-white">
            Select Your Service
          </h1>
          <p className="text-neutral-400 text-xl max-w-2xl">
            Premium support and tailored services to accelerate your journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </div>
  );
}
