
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

type ProtectedRouteProps = {
  requiredRole?: 'administrator' | 'support' | 'user';
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const { user, userRole, isLoading, fixUserPolicy } = useAuth();
  const location = useLocation();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [hasFixedPolicy, setHasFixedPolicy] = useState(false);

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
        hasFixedPolicy
      });

      // Determine if we need to redirect
      if (!user && !isLoading) {
        console.log("User not authenticated, will redirect to /auth");
        setRedirectPath(`/auth?from=${encodeURIComponent(location.pathname)}`);
      } else {
        setRedirectPath(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [user, userRole, isLoading, location.pathname, hasFixedPolicy]);

  // If there's an issue with the role check due to policy issues, try to fix it
  useEffect(() => {
    if (user && hasCheckedAuth && userRole === null && !hasFixedPolicy && !isLoading) {
      console.log("Attempting to fix user policy...");
      const attemptFix = async () => {
        try {
          await fixUserPolicy();
          setHasFixedPolicy(true);
          toast.success("Permissions system fixed successfully");
        } catch (error) {
          console.error("Failed to fix user policy:", error);
          toast.error("Could not fix permissions system. Please try again later.");
        }
      };
      
      attemptFix();
    }
  }, [user, userRole, hasCheckedAuth, hasFixedPolicy, fixUserPolicy, isLoading]);

  // Show loading state until we've checked authentication
  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  // If not authenticated, redirect to auth page
  if (redirectPath) {
    // Remember the page they were trying to access for potential redirect back after login
    return <Navigate to={redirectPath} replace />;
  }

  // If a specific role is required, use the role check
  if (requiredRole) {
    // If userRole is null due to database errors, we'll let the user through but show a warning
    // This prevents being locked out of the app when there are database issues
    if (userRole === null) {
      // Show a warning toast that role permissions couldn't be verified
      toast("Could not verify permission level. Some features may be restricted.", {
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
