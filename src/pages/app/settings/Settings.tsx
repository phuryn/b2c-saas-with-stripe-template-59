
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
        <div className="w-full md:w-52 shrink-0"> {/* Reduced width from 64 to 52 */}
          <div className="bg-white rounded-lg shadow p-4">
            <nav className="flex flex-col space-y-1">
              <Link 
                to="/app/settings/profile" 
                className={cn(
                  "px-4 py-2 rounded-md text-base hover:bg-gray-100 transition-colors", // 16px font size
                  isActive('/app/settings/profile') 
                    ? "bg-primary-blue/10 text-primary-blue" 
                    : "text-gray-700"
                )}
              >
                Profile
              </Link>
              <Link 
                to="/app/settings/billing" 
                className={cn(
                  "px-4 py-2 rounded-md text-base hover:bg-gray-100 transition-colors", // 16px font size
                  isActive('/app/settings/billing') 
                    ? "bg-primary-blue/10 text-primary-blue" 
                    : "text-gray-700"
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
