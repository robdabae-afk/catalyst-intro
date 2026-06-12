import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import FounderOnboarding from "./pages/FounderOnboarding";
import InvestorOnboarding from "./pages/InvestorOnboarding";
import Matches from "./pages/Matches";
import CoffeeChat from "./pages/CoffeeChat";
import Requests from "./pages/Requests";
import SafesList from "./pages/SafesList";
import SafeDetail from "./pages/SafeDetail";
import SafeGenerator from "./pages/SafeGenerator";
import CapTable from "./pages/CapTable";
import Investments from "./pages/Investments";
import Admin from "./pages/Admin";
import PendingApproval from "./pages/PendingApproval";
import ProfileView from "./pages/ProfileView";
import Settings from "./pages/Settings";
import FilterPreferences from "./pages/FilterPreferences";
import ReferralDashboard from "./pages/ReferralDashboard";
import NotFound from "./pages/NotFound";
import CatalystDeck from "./pages/CatalystDeck";
import InvestorPortal from "./pages/InvestorPortal";
import Concierge from "./pages/Concierge";
import Waitlist from "./pages/Waitlist";
import EarlyAccess from "./pages/EarlyAccess";
import FounderProfileInput from "./pages/FounderProfileInput";
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
import { AuthGuard } from "./components/AuthGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* New homepage: event sign-in */}
          <Route path="/" element={<EventSignIn />} />
          <Route path="/events" element={<EventSignIn />} />
          <Route path="/event" element={<EventSignIn />} />

          {/* Platform marketing/landing now lives at /app */}
          <Route path="/app" element={<Landing />} />

          {/* Public routes (kept at original paths AND mirrored under /app) */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/app/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/app/forgot-password" element={<ForgotPassword />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/app/waitlist" element={<Waitlist />} />
          <Route path="/early-access" element={<EarlyAccess />} />
          <Route path="/app/early-access" element={<EarlyAccess />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/app/pending-approval" element={<PendingApproval />} />
          <Route path="/onboarding/founder" element={<FounderOnboarding />} />
          <Route path="/app/onboarding/founder" element={<FounderOnboarding />} />
          <Route path="/onboarding/investor" element={<InvestorOnboarding />} />
          <Route path="/app/onboarding/investor" element={<InvestorOnboarding />} />
          <Route path="/profile/:id" element={<ProfileView />} />
          <Route path="/app/profile/:id" element={<ProfileView />} />
          <Route path="/catalystdeck" element={<CatalystDeck />} />
          <Route path="/app/catalystdeck" element={<CatalystDeck />} />

          {/* Protected Routes — require login + approved/early_access */}
          <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/app/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/matches" element={<AuthGuard><Matches /></AuthGuard>} />
          <Route path="/app/matches" element={<AuthGuard><Matches /></AuthGuard>} />
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
          <Route path="/investments" element={<AuthGuard><Investments /></AuthGuard>} />
          <Route path="/app/investments" element={<AuthGuard><Investments /></AuthGuard>} />
          <Route path="/requests" element={<AuthGuard><Requests /></AuthGuard>} />
          <Route path="/app/requests" element={<AuthGuard><Requests /></AuthGuard>} />
          <Route path="/admin" element={<AuthGuard><Admin /></AuthGuard>} />
          <Route path="/app/admin" element={<AuthGuard><Admin /></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
          <Route path="/app/settings" element={<AuthGuard><Settings /></AuthGuard>} />
          <Route path="/filters" element={<AuthGuard><FilterPreferences /></AuthGuard>} />
          <Route path="/app/filters" element={<AuthGuard><FilterPreferences /></AuthGuard>} />
          <Route path="/referrals" element={<AuthGuard><ReferralDashboard /></AuthGuard>} />
          <Route path="/app/referrals" element={<AuthGuard><ReferralDashboard /></AuthGuard>} />
          <Route path="/portal" element={<AuthGuard><InvestorPortal /></AuthGuard>} />
          <Route path="/app/portal" element={<AuthGuard><InvestorPortal /></AuthGuard>} />
          <Route path="/concierge" element={<AuthGuard><Concierge /></AuthGuard>} />
          <Route path="/app/concierge" element={<AuthGuard><Concierge /></AuthGuard>} />
          <Route path="/founder-input" element={<AuthGuard><FounderProfileInput /></AuthGuard>} />
          <Route path="/app/founder-input" element={<AuthGuard><FounderProfileInput /></AuthGuard>} />
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

          <Route path="/unsubscribe" element={<Unsubscribe />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
