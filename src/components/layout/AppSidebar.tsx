
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel,
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

const AppSidebar: React.FC = () => {
  const location = useLocation();
  const { state } = useSidebar();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

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
        <SidebarTrigger className="ml-auto">
          {state === 'collapsed' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
        </SidebarTrigger>
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
        
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive('/app')}
                  tooltip="Home"
                >
                  <Link to="/app">
                    <Home />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive('/app/links')}
                  tooltip="Links"
                >
                  <Link to="/app/links">
                    <Link2 />
                    <span>Links</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarSeparator />
        
        {/* Settings Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive('/app/settings')}
                  tooltip="Settings"
                >
                  <Link to="/app/settings">
                    <Settings />
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
