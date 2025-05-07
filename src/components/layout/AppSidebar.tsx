
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { Home, Link2, Settings, Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const AppSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Handle Settings click to collapse sidebar
  const handleSettingsClick = () => {
    if (state === 'expanded') {
      toggleSidebar();
    }
    navigate('/app/settings');
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
        <SidebarTrigger className="ml-auto" tooltip={state === 'collapsed' ? 'Expand sidebar' : 'Collapse sidebar'}>
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
        
        <SidebarSeparator />
        
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={isActive('/app')}
                tooltip="Home"
                className={cn(
                  isActive('/app') && "border-l-4 border-l-primary-blue bg-blue-50 text-blue-600"
                )}
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
                className={cn(
                  isActive('/app/links') && "border-l-4 border-l-primary-blue bg-blue-50 text-blue-600"
                )}
              >
                <Link to="/app/links">
                  <Link2 />
                  <span>Links</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarSeparator />
        
        {/* Settings Navigation */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild={false}
                isActive={isActive('/app/settings')}
                tooltip="Settings"
                className={cn(
                  isActive('/app/settings') && "border-l-4 border-l-primary-blue bg-blue-50 text-blue-600"
                )}
                onClick={handleSettingsClick}
              >
                <div className="flex gap-2">
                  <Settings />
                  <span>Settings</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
