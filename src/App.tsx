
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { isAppDomain } from "@/utils/domainUtils";

import PublicLayout from "./components/layout/PublicLayout";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Careers from "./pages/Careers";
import FAQs from "./pages/FAQs";
import Knowledge from "./pages/Knowledge";
import Support from "./pages/Support";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Auth from "./pages/Auth";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// App pages
import Dashboard from "./pages/app/Dashboard";
import Settings from "./pages/app/settings/Settings";
import ProfileSettings from "./pages/app/settings/ProfileSettings";
import BillingSettings from "./pages/app/settings/BillingSettings";
import PlanSettings from "./pages/app/settings/PlanSettings";
import AdminHome from "./pages/app/admin/AdminHome";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0, // Reduce retries to avoid unnecessary API calls
      refetchOnWindowFocus: false,
      staleTime: 30000, // Consider data fresh for 30 seconds
    },
  },
});

const App = () => {
  const [isOnAppDomain, setIsOnAppDomain] = useState(false);

  useEffect(() => {
    // Check if we're on an app.* domain
    setIsOnAppDomain(isAppDomain());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          {/* Both toast providers are needed for transition period */}
          <Toaster />
          <SonnerToaster 
            position="top-right" 
            closeButton
            duration={3000}
            richColors
          />
          <BrowserRouter>
            <Routes>
              {/* Conditional root route - redirect to /app if on app domain */}
              {isOnAppDomain ? (
                <Route path="/" element={<Navigate to="/app" replace />} />
              ) : (
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/careers" element={<Careers />} />
                  <Route path="/faqs" element={<FAQs />} />
                  <Route path="/knowledge" element={<Knowledge />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/privacy_policy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/signup" element={<Signup />} />
                  {/* Removed the /login redirect route as it's redundant with /auth */}
                </Route>
              )}
              
              {/* App routes - wrap with ProtectedRoute */}
              <Route element={<ProtectedRoute />}>
                <Route path="/app" element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="settings" element={<Settings />}>
                    <Route index element={<Navigate to="/app/settings/profile" replace />} />
                    <Route path="profile" element={<ProfileSettings />} />
                    <Route path="billing" element={<BillingSettings />} />
                    <Route path="plan" element={<PlanSettings />} />
                  </Route>
                </Route>
              </Route>
              
              {/* Protected routes for specific roles */}
              <Route element={<ProtectedRoute requiredRole="administrator" />}>
                <Route path="/app/admin" element={<AppLayout />}>
                  <Route index element={<AdminHome />} />
                </Route>
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
