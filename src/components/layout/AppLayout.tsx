
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
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const AppLayout: React.FC = () => {
  const { user, isLoading, userMetadata, profile, signOut } = useAuth();
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
                  <DropdownMenuItem className="font-medium" disabled>
                    My Account
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/app/settings/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          
          {/* User Profile Button for Mobile - Now using Dropdown instead of Sheet */}
          {isMobile && (
            <div className="fixed top-4 right-4 z-40">
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
                <DropdownMenuContent align="end" className="bg-white">
                  <DropdownMenuItem className="font-medium" disabled>
                    My Account
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/app/settings/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
