import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding/founder" element={<FounderOnboarding />} />
          <Route path="/onboarding/investor" element={<InvestorOnboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/coffeechat" element={<CoffeeChat />} />
          <Route path="/safes" element={<SafesList />} />
          <Route path="/safe" element={<SafeGenerator />} />
          <Route path="/safe/:id" element={<SafeDetail />} />
          <Route path="/captable" element={<CapTable />} />
          <Route path="/investments" element={<Investments />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile/:id" element={<ProfileView />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
