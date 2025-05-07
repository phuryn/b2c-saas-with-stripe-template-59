
import React, { useEffect } from 'react';
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
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Home, Link2, Settings, Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const AppSidebar: React.FC = () => {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  useEffect(() => {
    // Collapse sidebar when navigating to settings if it's expanded
    if (location.pathname.startsWith('/app/settings') && state === 'expanded') {
      toggleSidebar();
    }
  }, [location.pathname]);

  return (
    <Sidebar collapsible="icon">
      <SidebarRail />
      <SidebarHeader className="flex items-center justify-between">
        {/* App Logo - conditional based on sidebar state */}
        <div className="flex items-center px-2 py-3">
          <Link to="/app">
            {state === 'collapsed' ? (
              <img 
                src="/lovable-uploads/dfe9a235-bb0a-46f7-83e6-7b96aa0b49bd.png" 
                alt="TRUSTY" 
                className="h-7 w-auto object-contain" 
                width={28}
                height={28}
              />
            ) : (
              <img 
                src="/lovable-uploads/3fff3c36-d39f-4c4e-8e3f-56a242c5ac6f.png" 
                alt="TRUSTY" 
                className="h-7 w-auto" 
                width={120}
                height={28}
              />
            )}
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
      
      <SidebarContent>
        {/* Create New Button - shows icon only when collapsed */}
        <div className="px-2 mb-2">
          <Button className={cn(
            "w-full flex gap-2 bg-primary-blue hover:bg-primary-blue/90",
            state === 'collapsed' ? "justify-center" : ""
          )}>
            <Plus className="h-4 w-4" />
            {state !== 'collapsed' && <span>Create New</span>}
          </Button>
        </div>
        
        {/* Separator instead of label */}
        <SidebarSeparator className="my-2" />
        
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive('/app')}
                >
                  <Link to="/app" className={cn(
                    "text-gray-800",
                    isActive('/app') && "text-blue-600"
                  )}>
                    <Home className={cn(
                      isActive('/app') && "text-blue-600"
                    )} />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive('/app/links')}
                >
                  <Link to="/app/links" className={cn(
                    "text-gray-800",
                    isActive('/app/links') && "text-blue-600"
                  )}>
                    <Link2 className={cn(
                      isActive('/app/links') && "text-blue-600"
                    )} />
                    <span>Links</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Separator instead of label */}
        <SidebarSeparator className="my-2" />
        
        {/* Settings Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive('/app/settings')}
                >
                  <Link to="/app/settings" className={cn(
                    "text-gray-800",
                    isActive('/app/settings') && "text-blue-600"
                  )}>
                    <Settings className={cn(
                      isActive('/app/settings') && "text-blue-600"
                    )} />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
