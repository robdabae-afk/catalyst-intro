import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLanding from "./pages/app/AppLanding";
import AppSignup from "./pages/app/AppSignup";
import AppSignupForm from "./pages/app/AppSignupForm";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Matches from "./pages/Matches";
import CoffeeChat from "./pages/CoffeeChat";
import Requests from "./pages/Requests";
import SafesList from "./pages/SafesList";
import SafeDetail from "./pages/SafeDetail";
import SafeGenerator from "./pages/SafeGenerator";
import CapTable from "./pages/CapTable";
import Investments from "./pages/Investments";
import Admin from "./pages/Admin";

import ProfileView from "./pages/ProfileView";
import Settings from "./pages/Settings";
import FilterPreferences from "./pages/FilterPreferences";
import ReferralDashboard from "./pages/ReferralDashboard";
import NotFound from "./pages/NotFound";
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
import { AuthGuard } from "./components/AuthGuard";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Platform marketing/landing — homepage */}
          <Route path="/" element={<AppSignup />} />
          <Route path="/app" element={<AppLanding />} />
          <Route path="/app/signup" element={<AppSignup />} />
          <Route path="/signup" element={<AppSignup />} />
          <Route path="/app/signup/form" element={<AppSignupForm />} />
          <Route path="/signup/form" element={<AppSignupForm />} />

          {/* Event check-in */}
          <Route path="/events" element={<EventSignIn />} />
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
          <Route path="/profile/:id" element={<ProfileView />} />
          <Route path="/app/profile/:id" element={<ProfileView />} />
          <Route path="/catalystdeck" element={<CatalystDeck />} />
          <Route path="/app/catalystdeck" element={<CatalystDeck />} />
          <Route path="/catalystdeck/edit" element={<AuthGuard><CatalystDeckEditor /></AuthGuard>} />
          <Route path="/app/catalystdeck/edit" element={<AuthGuard><CatalystDeckEditor /></AuthGuard>} />


          {/* Protected Routes */}
          <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/app/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/home" element={<AppSignup />} />
          <Route path="/app/home" element={<AuthGuard><Home /></AuthGuard>} />
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

          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/app/waitlist" element={<Waitlist />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/app/onboarding" element={<Onboarding />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
