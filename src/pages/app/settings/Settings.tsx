
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const Settings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.split('/').pop() || 'profile';

  const handleTabChange = (value: string) => {
    navigate(`/app/settings/${value}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6 bg-gray-50 p-1 rounded-md">
          <TabsTrigger 
            value="profile" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5 rounded-md transition-all"
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger 
            value="billing" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5 rounded-md transition-all"
          >
            <CreditCard className="h-4 w-4" />
            <span>Billing</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="bg-white rounded-lg shadow p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default Settings;
