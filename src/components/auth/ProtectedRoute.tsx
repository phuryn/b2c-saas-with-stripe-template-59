
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [redirectCount, setRedirectCount] = useState(0); // Track redirects to prevent loops
  const [forceAccess, setForceAccess] = useState(false);

  useEffect(() => {
    // Reset redirect count when location changes
    if (location.pathname !== '/app') {
      setRedirectCount(0);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Give the auth system a bit more time to complete initialization
    const timer = setTimeout(() => {
      setHasCheckedAuth(true);
      
      // Log auth state for debugging
      console.log("Auth state in ProtectedRoute:", { 
        user: !!user, 
        isLoading, 
        path: location.pathname,
        redirectCount,
        search: location.search
      });

      // Detect potential redirect loop and allow access if needed
      if (redirectCount > 2) {
        console.warn("Multiple redirects detected, forcing app access");
        setForceAccess(true);
        return;
      }

      // Only redirect if not authenticated, not loading, and not already on auth page
      if (!user && !isLoading && !forceAccess) {
        console.log("User not authenticated in ProtectedRoute, redirecting to /auth");
        
        // Skip redirect entirely on auth pages to avoid loops
        if (location.pathname.startsWith('/auth') || location.pathname === '/signup') {
          console.log("Already on auth page, skipping redirect");
          return;
        }
        
        // Check localStorage for a recently completed login
        const recentLogin = localStorage.getItem('recentLogin');
        const recentLoginTime = recentLogin ? parseInt(recentLogin) : 0;
        const now = Date.now();
        
        // If user logged in within the last 5 seconds, don't redirect
        if (now - recentLoginTime < 5000) {
          console.log("Recent login detected in localStorage, skipping redirect");
          return;
        }
        
        // Check redirect count to prevent infinite loops
        if (redirectCount < 3) {
          setRedirectPath(`/auth?from=${encodeURIComponent(location.pathname)}`);
          setRedirectCount(prevCount => prevCount + 1);
        } else {
          console.warn("Too many redirects, stopping the redirect loop");
          toast.error("Authentication error - too many redirects");
          setRedirectPath(null);
        }
      } else {
        setRedirectPath(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [user, isLoading, location.pathname, location.search, redirectCount, forceAccess]);

  // Show loading state until we've checked authentication
  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  // If not authenticated, redirect to auth page (with redirect loop protection)
  if (redirectPath && redirectCount < 3 && !forceAccess) {
    // Remember the page they were trying to access for potential redirect back after login
    return <Navigate to={redirectPath} replace />;
  }

  // If too many redirects occurred, show an error message instead of redirecting
  if (redirectCount >= 3 && !forceAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 text-2xl mb-4">Authentication Error</div>
        <div className="text-gray-600 max-w-md text-center mb-6">
          Too many redirects detected. This could be due to an authentication issue or a permissions problem.
        </div>
        <button 
          onClick={() => window.location.href = '/auth'} 
          className="bg-primary-blue text-white px-4 py-2 rounded hover:bg-primary-blue/90"
        >
          Try Logging In Again
        </button>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
