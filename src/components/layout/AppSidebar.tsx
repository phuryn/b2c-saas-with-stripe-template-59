
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarSeparator, 
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { Home, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/context/AuthContext';

const AppSidebar: React.FC = () => {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

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
                  {/* The SidebarTrigger component now handles the icon internally */}
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
        {/* Separator */}
        <SidebarSeparator className="my-2 bg-gray-300" />
        
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/app')} className="text-base">
                  <Link to="/app" className={cn(
                    "text-gray-800 hover:bg-[rgb(247_247_247)]", 
                    isActive('/app') && "text-primary-blue bg-primary-blue/10"
                  )}>
                    <Home className={cn("h-5 w-5", isActive('/app') ? "text-primary-blue" : "text-gray-800")} />
                    <span className={cn(isActive('/app') && "text-primary-blue")}>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed top-4 left-4 z-40">
          <button
            className="p-2 rounded-md bg-white shadow-md flex items-center justify-center"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
        </div>
        
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[250px] p-0 bg-white">
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
