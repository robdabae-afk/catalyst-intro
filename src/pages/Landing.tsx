import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Coffee, FileText, TrendingUp, Users } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
const Landing = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(${heroBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 text-white tracking-tight">
            Swipe. Connect. Fund.
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-gray-200 max-w-3xl mx-auto">The simplest way for founders and investors to collaborate.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/onboarding/founder')} className="text-lg px-8 py-6 bg-white text-primary hover:bg-gray-100 shadow-lg">
              I'm a Founder
            </Button>
            <Button size="lg" onClick={() => navigate('/onboarding/investor')} className="text-lg px-8 py-6 bg-transparent border-2 border-white text-white hover:bg-white/10">
              I'm an Investor
            </Button>
          </div>
          
          <p className="mt-8 text-gray-300">
            Already have an account?{" "}
            <button onClick={() => navigate('/auth')} className="text-white underline hover:text-gray-200 transition-colors">
              Sign in
            </button>
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-foreground">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard icon={<Users className="w-8 h-8" />} title="Create a Profile" description="Share your startup story or investment thesis" />
            <FeatureCard icon={<Coffee className="w-8 h-8" />} title="Coffee Chats" description="Connect with founders and investors building the next big thing" />
            <FeatureCard icon={<FileText className="w-8 h-8" />} title="Send SAFEs" description="Streamline investment agreements digitally" />
            <FeatureCard icon={<TrendingUp className="w-8 h-8" />} title="Track Cap Table" description="Manage equity and investments in one place" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Connect?
          </h2>
          <p className="text-xl mb-10 opacity-90">
            Join the platform where meaningful founder-investor relationships begin
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/onboarding/founder')} className="text-lg px-8 py-6 bg-white text-primary hover:bg-gray-100">
              Get Started as Founder
            </Button>
            <Button size="lg" onClick={() => navigate('/onboarding/investor')} className="text-lg px-8 py-6 bg-transparent border-2 border-white hover:bg-white/10">
              Get Started as Investor
            </Button>
          </div>
        </div>
      </section>
    </div>;
};
const FeatureCard = ({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => <div className="p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-3 text-foreground">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
  </div>;
export default Landing;