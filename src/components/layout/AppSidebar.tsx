
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator, SidebarTrigger } from '@/components/ui/sidebar';
import { Home, Link2, Settings, ArrowLeft, ArrowRight, Menu, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const AppSidebar: React.FC = () => {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, userMetadata, profile, signOut } = useAuth();

  // Generate initials from display name or email
  const getInitials = () => {
    const name = profile?.display_name || userMetadata?.name || userMetadata?.full_name || user?.email?.split('@')[0] || 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app' || location.pathname === '/app/home';
    }
    return location.pathname.startsWith(path);
  };

  const renderSidebarContent = () => (
    <>
      {/* App Logo - conditional based on sidebar state */}
      <SidebarHeader className="flex items-center justify-between">
        <div className="flex items-center py-3">
          <Link to="/app">
            {state === 'collapsed' ? <img src="/small-logo.svg" alt="TRUSTY" width={28} height={28} className="h-5 w-auto object-contain" /> : <img src="/primary-logo.svg" alt="TRUSTY" width={120} height={28} className="h-5 w-auto" />}
          </Link>
        </div>
        {!isMobile && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger className="ml-auto">
                  {state === 'collapsed' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                </SidebarTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">
                {state === 'collapsed' ? 'Expand sidebar' : 'Collapse sidebar'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </SidebarHeader>
      
      <SidebarContent className="bg-white">
        {isMobile && (
          <div className="px-4 py-2 mb-2">
            <div className="flex items-center space-x-3">
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
          </div>
        )}
        
        {/* Separator */}
        <SidebarSeparator className="my-2 bg-gray-300" />
        
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/app')}>
                  <Link to="/app" className={cn("text-gray-800 hover:bg-[rgb(247_247_247)]", isActive('/app') && "text-primary-blue bg-primary-blue/10", "text-base")}>
                    <Home className={cn("h-5 w-5", isActive('/app') ? "text-primary-blue" : "text-gray-800")} />
                    <span className={cn(isActive('/app') && "text-primary-blue")}>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/app/links')}>
                  <Link to="/app/links" className={cn("text-gray-800 hover:bg-[rgb(247_247_247)]", isActive('/app/links') && "text-primary-blue bg-primary-blue/10", "text-base")}>
                    <Link2 className={cn("h-5 w-5", isActive('/app/links') ? "text-primary-blue" : "text-gray-800")} />
                    <span className={cn(isActive('/app/links') && "text-primary-blue")}>Links</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Separator */}
        <SidebarSeparator className="my-2 bg-gray-300" />
        
        {/* Settings Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/app/settings')}>
                  <Link to="/app/settings" className={cn("text-gray-800 hover:bg-[rgb(247_247_247)]", isActive('/app/settings') && "text-primary-blue bg-primary-blue/10", "text-base")}>
                    <Settings className={cn("h-5 w-5", isActive('/app/settings') ? "text-primary-blue" : "text-gray-800")} />
                    <span className={cn(isActive('/app/settings') && "text-primary-blue")}>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {isMobile && (
          <>
            <SidebarSeparator className="my-2 bg-gray-300" />
            <div className="px-4 py-2">
              <button 
                onClick={signOut}
                className="w-full text-left px-2 py-2 rounded-md text-red-600 hover:bg-red-50 text-base"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </SidebarContent>
    </>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed top-4 right-4 z-40 flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userMetadata?.avatar_url} alt={profile?.display_name || user?.email?.split('@')[0] || 'User'} />
            <AvatarFallback>
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          <button
            className="p-2 rounded-md bg-white shadow-md flex items-center justify-center"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
        </div>
        
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="right" className="w-[250px] p-0 bg-white">
            {renderSidebarContent()}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return <Sidebar collapsible="icon" className="bg-white" style={{
    '--sidebar-width': '13rem',
    '--sidebar-width-icon': '2.75rem'
  } as React.CSSProperties}>
    {renderSidebarContent()}
  </Sidebar>;
};

export default AppSidebar;
