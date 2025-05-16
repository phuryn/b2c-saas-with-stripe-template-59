
import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import AppSidebar from './AppSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSubscription } from '@/hooks/useSubscription';
import UserProfileMenu from './UserProfileMenu';

const AppLayout: React.FC = () => {
  const {
    user,
    isLoading: authLoading,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Get subscription data with initialization
  const {
    checkSubscriptionStatus
  } = useSubscription();

  // Only initialize subscription once after auth is confirmed
  useEffect(() => {
    // Only check subscription once auth is confirmed and user exists
    if (user && !authLoading && !initialCheckDone && !location.pathname.startsWith('/auth')) {
      console.log("Auth confirmed in AppLayout, checking subscription status once");
      // Use a slight delay to ensure auth is fully propagated
      const timer = setTimeout(() => {
        checkSubscriptionStatus(false); // Don't force check - respect caching
        setInitialCheckDone(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, initialCheckDone]);

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Navigate to the upgrade page
  const handleUpgrade = () => {
    navigate('/app/settings/plan');
  };

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    console.log("User not authenticated in AppLayout, redirecting to /auth");
    return <Navigate to={`/auth?from=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Show loading state
  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[rgb(247_247_247)]">
        <AppSidebar />
        <div className="flex-1 min-h-screen relative">
          {/* User Profile Menu - now in a non-absolute row aligned to the right */}
          <div className="flex justify-end pr-6 pb-0 z-10">
            <UserProfileMenu onSignOut={handleSignOut} onUpgrade={handleUpgrade} />
          </div>
          
          {/* Apply padding for mobile view to all app pages via wrapper */}
          <div className={isMobile ? "pt-16" : ""}>
            <Outlet />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
