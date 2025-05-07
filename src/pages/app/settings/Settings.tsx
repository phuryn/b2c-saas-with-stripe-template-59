
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const Settings: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-lg shadow p-4">
            <nav className="flex flex-col space-y-1">
              <Link 
                to="/app/settings/profile" 
                className={cn(
                  "px-4 py-2 rounded-md hover:bg-gray-100 transition-colors",
                  isActive('/app/settings/profile') ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600" : "text-gray-700"
                )}
              >
                Profile
              </Link>
              <Link 
                to="/app/settings/billing" 
                className={cn(
                  "px-4 py-2 rounded-md hover:bg-gray-100 transition-colors",
                  isActive('/app/settings/billing') ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600" : "text-gray-700"
                )}
              >
                Billing and Usage
              </Link>
            </nav>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
