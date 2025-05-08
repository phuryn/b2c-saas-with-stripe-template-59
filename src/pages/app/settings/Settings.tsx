
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, CreditCard, ChevronDown, FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const Settings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.split('/').pop() || 'profile';
  const isMobile = useIsMobile();
  
  const handleTabChange = (value: string) => {
    navigate(`/app/settings/${value}`);
  };
  
  const tabs = [
    { value: 'profile', label: 'Profile', icon: User },
    { value: 'billing', label: 'Billing', icon: CreditCard },
    { value: 'plan', label: 'Plan', icon: FileText },
  ];
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      
      {isMobile ? (
        <div className="mb-6">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center justify-between bg-white border rounded-md p-3 shadow-sm">
              <div className="flex items-center gap-2">
                {tabs.find(tab => tab.value === activeTab)?.icon && (
                  React.createElement(tabs.find(tab => tab.value === activeTab)?.icon as React.ElementType, { className: "h-4 w-4" })
                )}
                <span className="capitalize">{activeTab}</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px] bg-white">
              {tabs.map((tab) => (
                <DropdownMenuItem 
                  key={tab.value} 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => handleTabChange(tab.value)}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mb-6">
          <TabsList className="flex justify-start p-1 rounded-md bg-transparent w-fit">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5 rounded-md transition-all max-w-[150px]"
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      
      <div className="bg-white rounded-lg shadow p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default Settings;
