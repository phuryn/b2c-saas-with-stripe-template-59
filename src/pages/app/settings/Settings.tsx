
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, CreditCard, Activity } from 'lucide-react';
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
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Billing</span>
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Usage</span>
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
