
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

type ProtectedRouteProps = {
  requiredRole?: 'administrator' | 'support' | 'user';
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const { user, userRole, isLoading } = useAuth();
  const location = useLocation();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Give the auth system a bit more time to complete initialization
    const timer = setTimeout(() => {
      setHasCheckedAuth(true);
      setIsAuthenticated(!!user);

      // Log auth state for debugging
      console.log("Auth state in ProtectedRoute:", { 
        user: !!user, 
        userRole, 
        isLoading, 
        path: location.pathname 
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [user, userRole, isLoading, location.pathname]);

  // Show loading state until we've checked authentication
  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  // If not authenticated, redirect to auth page
  if (!isAuthenticated) {
    console.log("User not authenticated, redirecting to /auth");
    // Remember the page they were trying to access for potential redirect back after login
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
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
