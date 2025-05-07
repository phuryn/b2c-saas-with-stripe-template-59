import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator, SidebarTrigger } from '@/components/ui/sidebar';
import { Home, Link2, Settings, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
const AppSidebar: React.FC = () => {
  const location = useLocation();
  const {
    state,
    toggleSidebar
  } = useSidebar();
  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app' || location.pathname === '/app/home';
    }
    return location.pathname.startsWith(path);
  };
  return <Sidebar collapsible="icon" className="bg-white" style={{
    '--sidebar-width': '13rem',
    '--sidebar-width-icon': '2.75rem'
  } as React.CSSProperties}>
      <SidebarHeader className="flex items-center justify-between">
        {/* App Logo - conditional based on sidebar state */}
        <div className="flex items-center px-2 py-3">
          <Link to="/app">
            {state === 'collapsed' ? <img src="/lovable-uploads/dfe9a235-bb0a-46f7-83e6-7b96aa0b49bd.png" alt="TRUSTY" width={28} height={28} className="h-5 w-auto object-contain" /> : <img src="/lovable-uploads/3fff3c36-d39f-4c4e-8e3f-56a242c5ac6f.png" alt="TRUSTY" width={120} height={28} className="h-5 w-auto" />}
          </Link>
        </div>
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
      </SidebarHeader>
      
      <SidebarContent className="bg-white">
        {/* Separator instead of label */}
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
        
        {/* Separator instead of label */}
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
      </SidebarContent>
    </Sidebar>;
};
export default AppSidebar;