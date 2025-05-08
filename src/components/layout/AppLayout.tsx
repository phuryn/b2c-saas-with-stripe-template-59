
import React, { useState } from 'react';
import { Navigate, Outlet, useNavigate, Link } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import AppSidebar from './AppSidebar';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSubscription } from '@/hooks/useSubscription';

const AppLayout: React.FC = () => {
  const { user, isLoading, userMetadata, profile, signOut } = useAuth();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Get user initials for avatar
  const getInitials = () => {
    const name = profile?.display_name || userMetadata?.name || userMetadata?.full_name || user?.email?.split('@')[0] || 'U';
    return name.substring(0, 2).toUpperCase();
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Redirect to login if not authenticated
  if (!isLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  const renderUserMenu = () => (
    <div className="w-64 p-2">
      {/* User info section */}
      <div className="flex items-center space-x-3 mb-4 px-2">
        <Avatar className="h-10 w-10">
          <AvatarImage src={userMetadata?.avatar_url} alt={profile?.display_name || user?.email?.split('@')[0] || 'User'} />
          <AvatarFallback>
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium text-base">
            {profile?.display_name || userMetadata?.name || userMetadata?.full_name || user?.email?.split('@')[0] || 'User'}
          </span>
          <span className="text-xs text-gray-500">{user?.email}</span>
        </div>
      </div>

      {/* Separator */}
      <DropdownMenuSeparator className="my-2" />

      {/* Plan section */}
      <div className="px-2 py-1">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">
            {subscription?.subscribed ? subscription.subscription_tier : 'Free Plan'}
          </span>
          {!subscription?.subscribed && (
            <Link 
              to="/app/settings/plan"
              className="text-xs px-2 py-1 bg-primary-blue text-white rounded hover:bg-primary-blue/90 transition-colors"
            >
              Upgrade
            </Link>
          )}
        </div>
      </div>

      {/* Separator */}
      <DropdownMenuSeparator className="my-2" />

      {/* Settings link */}
      <Link 
        to="/app/settings"
        className="block w-full text-left px-2 py-2 rounded-md text-gray-700 hover:bg-gray-100"
      >
        Settings
      </Link>
      
      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="block w-full text-left px-2 py-2 rounded-md text-red-600 hover:bg-red-50"
      >
        Sign Out
      </button>
    </div>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[rgb(247_247_247)]">
        <AppSidebar />
        <div className="flex-1 min-h-screen relative">
          {/* User Profile Dropdown for Desktop */}
          {!isMobile && (
            <div className="absolute top-4 right-4 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="focus:outline-none">
                    <Avatar className="h-9 w-9 cursor-pointer">
                      <AvatarImage src={userMetadata?.avatar_url} alt={profile?.display_name || user?.email?.split('@')[0] || 'User'} />
                      <AvatarFallback>
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {renderUserMenu()}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          
          {/* User Profile Dropdown for Mobile */}
          {isMobile && (
            <div className="fixed top-4 right-4 z-40">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="focus:outline-none">
                    <Avatar className="h-9 w-9 cursor-pointer">
                      <AvatarImage src={userMetadata?.avatar_url} alt={profile?.display_name || user?.email?.split('@')[0] || 'User'} />
                      <AvatarFallback>
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-64" align="end">
                  {renderUserMenu()}
                </PopoverContent>
              </Popover>
            </div>
          )}
          
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
