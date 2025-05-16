
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Auth from '@/pages/Auth';
import Signup from '@/pages/Signup';
import Pricing from '@/pages/Pricing';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy'; // Changed from PrivacyPolicy to Privacy
import AppLayout from '@/components/layout/AppLayout';
import PublicLayout from '@/components/layout/PublicLayout';
import Dashboard from '@/pages/app/Dashboard';
import Settings from '@/pages/app/settings/Settings'; // Changed path to match the actual file location
import BillingSettings from '@/pages/app/settings/BillingSettings';
import PlanSettings from '@/pages/app/settings/PlanSettings';
import { AuthProvider } from '@/context/AuthContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SubscriptionProvider>
          <Routes>
            {/* Public Routes with PublicLayout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Auth />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy_policy" element={<Privacy />} />
            </Route>
            
            {/* App Routes */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="settings" element={<Settings />} />
              <Route path="settings/billing" element={<BillingSettings />} />
              <Route path="settings/plan" element={<PlanSettings />} />
            </Route>

            {/* Catch-all route to redirect to the dashboard */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
