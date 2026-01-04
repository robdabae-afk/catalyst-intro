import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Coffee, FileText, TrendingUp, Users, Banknote, ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { FeaturedProfileCard } from "@/components/FeaturedProfileCard";

const Landing = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-background">
    {/* Hero Section */}
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(${heroBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Column - Profile Card */}
          <div className="flex justify-center lg:justify-start order-2 lg:order-1 transform scale-[0.6] md:scale-100 origin-top lg:origin-center mt-8 md:mt-0">
            <FeaturedProfileCard />
          </div>

          {/* Right Column - Marketing Content */}
          <div className="text-center lg:text-left space-y-8 order-1 lg:order-2">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
                Swipe. Connect. Fund.
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto lg:mx-0">
                The simplest way for founders and investors to collaborate. Build your future with the right partners.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" onClick={() => navigate('/onboarding/founder')} className="text-lg px-8 py-6 bg-white text-primary hover:bg-gray-100 shadow-lg">
                I'm a Founder
              </Button>
              <Button size="lg" onClick={() => navigate('/onboarding/investor')} className="text-lg px-8 py-6 bg-transparent border-2 border-white text-white hover:bg-white/10">
                I'm an Investor
              </Button>
            </div>

            <p className="text-gray-300">
              Already have an account?{" "}
              <button onClick={() => navigate('/auth')} className="text-white underline hover:text-gray-200 transition-colors">
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* How It Works */}
    <section className="py-24 px-6 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-foreground">
          How It Works
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard icons={[<Users className="w-8 h-8" />]} title="Create a Profile" description="Share your startup story or investment thesis" />
          <FeatureCard icons={[<Coffee className="w-8 h-8" />]} title="Swipe & Connect" description="Swipe when you see someone or something you like. If the feeling is mutual? Collaborate & communicate immediately." />
          <FeatureCard icons={[<FileText className="w-8 h-8" />, <Banknote className="w-8 h-8" />]} title="Sign SAFEs & Disburse Funds" description="Streamline investment agreements digitally" />
          <FeatureCard icons={[<TrendingUp className="w-8 h-8" />]} title="Track Cap Table" description="Manage equity and investments in one place" />
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
  icons,
  title,
  description
}: {
  icons: React.ReactNode[];
  title: string;
  description: string;
}) => <div className="p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-2 mb-6">
      {icons.map((icon, index) => (
        <div key={index} className="contents">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          {index < icons.length - 1 && (
            <ArrowRight className="w-5 h-5 text-muted-foreground/50" />
          )}
        </div>
      ))}
    </div>
    <h3 className="text-xl font-semibold mb-3 text-foreground">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
  </div>;
export default Landing;