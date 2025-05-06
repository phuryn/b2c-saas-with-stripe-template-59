
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

type ProtectedRouteProps = {
  requiredRole?: 'administrator' | 'support' | 'user';
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const { user, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  // If not authenticated, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If a specific role is required, check if user has that role
  if (requiredRole && userRole !== requiredRole && userRole !== 'administrator') {
    // Administrators can access all routes
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
