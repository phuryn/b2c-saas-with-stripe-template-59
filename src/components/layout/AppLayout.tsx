
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

const AppLayout: React.FC = () => {
  const { user, isLoading, userMetadata, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  
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
    <div className="p-4">
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

      <div className="text-sm px-2 mb-2 text-gray-500 font-medium">My Profile</div>
      
      <Link 
        to="/app/settings/profile" 
        className="block w-full text-left px-2 py-2 rounded-md text-gray-700 hover:bg-gray-100"
        onClick={() => isMobile && setMobileUserMenuOpen(false)}
      >
        Profile
      </Link>
      
      <button
        onClick={() => {
          handleSignOut();
          if (isMobile) setMobileUserMenuOpen(false);
        }}
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
          
          {/* User Profile Button for Mobile */}
          {isMobile && (
            <div className="fixed top-4 right-4 z-40">
              <button 
                className="focus:outline-none"
                onClick={() => setMobileUserMenuOpen(true)}
              >
                <Avatar className="h-9 w-9 cursor-pointer">
                  <AvatarImage src={userMetadata?.avatar_url} alt={profile?.display_name || user?.email?.split('@')[0] || 'User'} />
                  <AvatarFallback>
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </button>
              
              {/* Mobile User Profile Sheet */}
              <Sheet open={mobileUserMenuOpen} onOpenChange={setMobileUserMenuOpen}>
                <SheetContent side="right" className="w-[250px] p-0 bg-white">
                  {renderUserMenu()}
                </SheetContent>
              </Sheet>
            </div>
          )}
          
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
