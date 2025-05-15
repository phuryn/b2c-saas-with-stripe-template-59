
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

type ProtectedRouteProps = {
  requiredRole?: 'administrator' | 'support' | 'user';
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const { user, userRole, isLoading } = useAuth();
  const location = useLocation();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [redirectCount, setRedirectCount] = useState(0); // Track redirects to prevent loops

  useEffect(() => {
    // Give the auth system a bit more time to complete initialization
    const timer = setTimeout(() => {
      setHasCheckedAuth(true);
      
      // Log auth state for debugging
      console.log("Auth state in ProtectedRoute:", { 
        user: !!user, 
        userRole, 
        isLoading, 
        path: location.pathname,
        redirectCount,
        search: location.search
      });

      // Only redirect if not authenticated, not loading, and not already on auth page
      if (!user && !isLoading) {
        console.log("User not authenticated, will redirect to /auth");
        
        // Skip redirect entirely on auth pages to avoid loops
        if (location.pathname.startsWith('/auth') || location.pathname === '/signup') {
          console.log("Already on auth page, skipping redirect");
          return;
        }
        
        // IMPORTANT: Don't redirect from /app to /auth if we just came from a login flow
        // This checks for the directLogin parameter that might be set during OAuth redirects
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('directLogin') === 'true') {
          console.log("Direct login detected, skipping redirect to give auth time to initialize");
          return;
        }
        
        // Also check localStorage for a recently completed login
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
  }, [user, userRole, isLoading, location.pathname, location.search, redirectCount]);

  // Show loading state until we've checked authentication
  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  // If not authenticated, redirect to auth page (with redirect loop protection)
  if (redirectPath && redirectCount < 3) {
    // Remember the page they were trying to access for potential redirect back after login
    return <Navigate to={redirectPath} replace />;
  }

  // If too many redirects occurred, show an error message instead of redirecting
  if (redirectCount >= 3) {
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

  // If a specific role is required, use the role check
  if (requiredRole) {
    // If userRole is null due to database errors, we'll let the user through but show a warning
    // This prevents being locked out of the app when there are database issues
    if (userRole === null) {
      // Show a warning toast that role permissions couldn't be verified
      toast.warning("Could not verify permission level. Some features may be restricted.", {
        duration: 5000,
      });
      console.warn("User role check failed, proceeding with limited access");
      return <Outlet />;
    }

    // Check if user has required role (administrators can access everything)
    if (userRole !== requiredRole && userRole !== 'administrator') {
      console.log(`User role ${userRole} does not match required role ${requiredRole}`);
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
