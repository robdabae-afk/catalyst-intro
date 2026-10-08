import { ProfileReviewGate } from "@/components/ProfileReviewGate";
import { Toaster } from "@/components/ui/toaster";
import InviteLanding from "./pages/InviteLanding";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FeaturesApp from "./features/FeaturesApp";
import { isDemoMode } from "@/demo/mode";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import AppLanding from "./pages/app/AppLanding";
import { CatalystLightTheme } from "./components/CatalystLightTheme";
import AppSignup from "./pages/app/AppSignup";
import AppSignupForm from "./pages/app/AppSignupForm";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import LatestUpdates from "./pages/LatestUpdates";
import Matches from "./pages/Matches";
import Connections from "./pages/Connections";
import CoffeeChat from "./pages/CoffeeChat";
import Requests from "./pages/Requests";
import SafesList from "./pages/SafesList";
import SafeDetail from "./pages/SafeDetail";
import SafeGenerator from "./pages/SafeGenerator";
import CapTable from "./pages/CapTable";
import Investments from "./pages/Investments";
import InvestorPortfolio from "./pages/InvestorPortfolio";
import Admin from "./pages/Admin";
import FounderAnalytics from "./pages/FounderAnalytics";
import InvestorMarketPulse from "./pages/InvestorMarketPulse";

import ProfileView from "./pages/ProfileView";
import Settings from "./pages/Settings";
import FilterPreferences from "./pages/FilterPreferences";
import ReferralDashboard from "./pages/ReferralDashboard";
import CatalystDeck from "./pages/CatalystDeck";
import CatalystDeckEditor from "./pages/CatalystDeckEditor";
import InvestorPortal from "./pages/InvestorPortal";
import Concierge from "./pages/Concierge";
import EventSignIn from "./pages/EventSignIn";
import MatchLanding from "./pages/match/MatchLanding";
import MatchAuth from "./pages/match/MatchAuth";
import MatchOnboarding from "./pages/match/MatchOnboarding";
import MatchEvent from "./pages/match/MatchEvent";
import MatchDiscover from "./pages/match/MatchDiscover";
import MatchInbox from "./pages/match/MatchInbox";
import MatchThread from "./pages/match/MatchThread";
import MatchAdminEvents from "./pages/match/MatchAdminEvents";
import Unsubscribe from "./pages/Unsubscribe";
import Onboarding from "./pages/Onboarding";
import Waitlist from "./pages/Waitlist";
import Landing from "./redesign/Landing";
import { About, Community, Privacy, Terms, RdNotFound } from "./redesign/Pages";
import ExitFundHome from "./exitfund/ExitFundHome";
import ExitFundMission from "./exitfund/ExitFundMission";
import ExitFundAbout from "./exitfund/ExitFundAbout";
import ExitFundTeam from "./exitfund/ExitFundTeam";
import ExitFundContact from "./exitfund/ExitFundContact";
import { AuthGuard } from "./components/AuthGuard";
import { adminRoutes } from "./admin/routes";
import AppLogin from "./admin/Login";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={isDemoMode() ? "/demo" : undefined}>
        <CatalystLightTheme />
        <Routes>
          {/* Marketing landing (the production app lives at "/") */}
          <Route path="/" element={<Landing />} />
          <Route path="/intro" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/community" element={<Community />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/app" element={<AppLanding />} />
          <Route path="/discover" element={<Navigate replace to="/people/swipe" />} />
          <Route path="/app/discover" element={<Navigate replace to="/people/swipe" />} />
          <Route path="/app/x/*" element={<RootRedirect from="/app/x" />} />
          <Route path="/app/live/*" element={<RootRedirect from="/app/live" />} />
          <Route path="/app/signup" element={<AppSignup />} />
          <Route path="/signup" element={<AppSignup />} />
          <Route path="/i/:code" element={<InviteLanding />} />
          <Route path="/app/signup/form" element={<AppSignupForm />} />
          <Route path="/signup/form" element={<AppSignupForm />} />

          {/* Event check-in */}
          <Route path="/app/events" element={<EventSignIn />} />
          <Route path="/event" element={<EventSignIn />} />

          {/* Public routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/app/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/app/forgot-password" element={<ForgotPassword />} />
          {/* Legacy aliases — route to new signup */}
          <Route path="/onboarding/founder" element={<AppSignup />} />
          <Route path="/app/onboarding/founder" element={<AppSignup />} />
          <Route path="/onboarding/investor" element={<AppSignup />} />
          <Route path="/app/onboarding/investor" element={<AppSignup />} />
          <Route path="/profile/:id" element={<ProfileReviewGate><ProfileView /></ProfileReviewGate>} />
          <Route path="/app/profile/:id" element={<ProfileReviewGate><ProfileView /></ProfileReviewGate>} />
          <Route path="/catalystdeck" element={<CatalystDeck />} />
          <Route path="/app/catalystdeck" element={<CatalystDeck />} />
          <Route path="/catalystdeck/edit" element={<AuthGuard><CatalystDeckEditor /></AuthGuard>} />
          <Route path="/app/catalystdeck/edit" element={<AuthGuard><CatalystDeckEditor /></AuthGuard>} />


          {/* Protected Routes */}
          <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/app/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/home" element={<AppSignup />} />
          <Route path="/app/home" element={<Navigate replace to="/feed" />} />
          <Route path="/updates" element={<AuthGuard><LatestUpdates /></AuthGuard>} />
          <Route path="/app/updates" element={<AuthGuard><LatestUpdates /></AuthGuard>} />
          <Route path="/matches" element={<AuthGuard><Matches /></AuthGuard>} />
          <Route path="/app/matches" element={<AuthGuard><Matches /></AuthGuard>} />
          <Route path="/connections" element={<AuthGuard><Connections /></AuthGuard>} />
          <Route path="/app/connections" element={<AuthGuard><Connections /></AuthGuard>} />
          <Route path="/coffeechat" element={<AuthGuard><CoffeeChat /></AuthGuard>} />
          <Route path="/app/coffeechat" element={<AuthGuard><CoffeeChat /></AuthGuard>} />
          <Route path="/safes" element={<AuthGuard><SafesList /></AuthGuard>} />
          <Route path="/app/safes" element={<AuthGuard><SafesList /></AuthGuard>} />
          <Route path="/safe" element={<AuthGuard><SafeGenerator /></AuthGuard>} />
          <Route path="/app/safe" element={<AuthGuard><SafeGenerator /></AuthGuard>} />
          <Route path="/safe/:id" element={<AuthGuard><SafeDetail /></AuthGuard>} />
          <Route path="/app/safe/:id" element={<AuthGuard><SafeDetail /></AuthGuard>} />
          <Route path="/captable" element={<AuthGuard><CapTable /></AuthGuard>} />
          <Route path="/app/captable" element={<AuthGuard><CapTable /></AuthGuard>} />
          <Route path="/app/portfolio" element={<Navigate replace to="/portfolio" />} />
          <Route path="/founder-analytics" element={<AuthGuard><FounderAnalytics /></AuthGuard>} />
          <Route path="/app/founder-analytics" element={<AuthGuard><FounderAnalytics /></AuthGuard>} />
          <Route path="/market-pulse" element={<AuthGuard><InvestorMarketPulse /></AuthGuard>} />
          <Route path="/app/market-pulse" element={<AuthGuard><InvestorMarketPulse /></AuthGuard>} />
          <Route path="/investments" element={<AuthGuard><Investments /></AuthGuard>} />
          <Route path="/app/investments" element={<AuthGuard><Investments /></AuthGuard>} />
          <Route path="/requests" element={<AuthGuard><Requests /></AuthGuard>} />
          <Route path="/app/requests" element={<AuthGuard><Requests /></AuthGuard>} />
          {adminRoutes}
          <Route path="/app/admin" element={<AuthGuard><Admin /></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard allowNonAdmin><Settings /></AuthGuard>} />
          <Route path="/app/settings" element={<AuthGuard allowNonAdmin><Settings /></AuthGuard>} />
          <Route path="/filters" element={<AuthGuard><FilterPreferences /></AuthGuard>} />
          <Route path="/app/filters" element={<AuthGuard><FilterPreferences /></AuthGuard>} />
          <Route path="/referrals" element={<AuthGuard><ReferralDashboard /></AuthGuard>} />
          <Route path="/app/referrals" element={<AuthGuard><ReferralDashboard /></AuthGuard>} />
          <Route path="/portal" element={<AuthGuard><InvestorPortal /></AuthGuard>} />
          <Route path="/app/portal" element={<AuthGuard><InvestorPortal /></AuthGuard>} />
          <Route path="/concierge" element={<AuthGuard><Concierge /></AuthGuard>} />
          <Route path="/app/concierge" element={<AuthGuard><Concierge /></AuthGuard>} />

          {/* /match — Live event matching platform (separate accounts) */}
          <Route path="/match" element={<MatchLanding />} />
          <Route path="/match/auth" element={<MatchAuth />} />
          <Route path="/match/onboarding" element={<MatchOnboarding />} />
          <Route path="/match/profile" element={<MatchOnboarding />} />
          <Route path="/match/event" element={<MatchEvent />} />
          <Route path="/match/discover" element={<MatchDiscover />} />
          <Route path="/match/inbox" element={<MatchInbox />} />
          <Route path="/match/thread/:id" element={<MatchThread />} />
          <Route path="/match/admin" element={<MatchAdminEvents />} />

          {/* /exitfund — The Exit Fund, by Catalyst (public marketing site) */}
          <Route path="/exitfund" element={<ExitFundHome />} />
          <Route path="/exitfund/home" element={<ExitFundHome />} />
          <Route path="/exitfund/mission" element={<ExitFundMission />} />
          <Route path="/exitfund/about" element={<ExitFundAbout />} />
          <Route path="/exitfund/aboutus" element={<ExitFundAbout />} />
          <Route path="/exitfund/team" element={<ExitFundTeam />} />
          <Route path="/exitfund/contact" element={<ExitFundContact />} />

          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/app/waitlist" element={<Waitlist />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/app/onboarding" element={<Onboarding />} />

          <Route path="/app/login" element={<AppLogin />} />
          {/* Production app at the root: /, /swipe, /search, /inbox, /company/:id, /events, /portfolio ... */}
          <Route path="/*" element={<FeaturesApp />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

function RootRedirect({ from }: { from: string }) {
  const loc = useLocation();
  const rest = loc.pathname.slice(from.length) || "/";
  return <Navigate replace to={(rest.startsWith("/") ? rest : `/${rest}`) + loc.search + loc.hash} />;
}
