
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
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
import { Home, Link2, Settings, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const AppSidebar: React.FC = () => {
  const location = useLocation();
  const { userMetadata, user } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarRail />
      <SidebarHeader className="flex items-center justify-between">
        {/* App Logo */}
        <div className="flex items-center px-2 py-3">
          <Link to="/app">
            <img 
              src="/lovable-uploads/2d719fe8-edcb-42b6-a0ea-ca7e43cbe81c.png" 
              alt="TRUSTY" 
              className="h-7 w-auto" 
              width={120}
              height={28}
            />
          </Link>
        </div>
        <SidebarTrigger />
      </SidebarHeader>
      
      <SidebarContent>
        {/* Create New Button */}
        <div className="px-2 mb-2">
          <Button className="w-full flex gap-2 bg-primary-blue hover:bg-primary-blue/90">
            <Plus className="h-4 w-4" />
            <span>Create New</span>
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
      
      <SidebarFooter>
        <div className="p-2">
          <Link to="/app/settings/profile" className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent transition-colors",
            isActive('/app/settings/profile') && "bg-sidebar-accent"
          )}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={userMetadata?.avatar_url} alt={userMetadata?.name || user?.email?.split('@')[0] || 'User'} />
              <AvatarFallback>
                {(userMetadata?.name || user?.email?.split('@')[0] || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <div className="font-medium truncate">{userMetadata?.name || userMetadata?.full_name || user?.email?.split('@')[0]}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
