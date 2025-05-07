
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

const Settings: React.FC = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const NavLinks = () => (
    <nav className="flex flex-col space-y-1">
      <Link 
        to="/app/settings/profile" 
        className={cn(
          "px-4 py-2 rounded-md text-base hover:bg-gray-100 transition-colors",
          isActive('/app/settings/profile') 
            ? "bg-primary-blue/10 text-primary-blue" 
            : "text-gray-700"
        )}
        onClick={() => setOpen(false)}
      >
        Profile
      </Link>
      <Link 
        to="/app/settings/billing" 
        className={cn(
          "px-4 py-2 rounded-md text-base hover:bg-gray-100 transition-colors",
          isActive('/app/settings/billing') 
            ? "bg-primary-blue/10 text-primary-blue" 
            : "text-gray-700"
        )}
        onClick={() => setOpen(false)}
      >
        Billing and Usage
      </Link>
      <Link 
        to="/app/settings/plan" 
        className={cn(
          "px-4 py-2 rounded-md text-base hover:bg-gray-100 transition-colors",
          isActive('/app/settings/plan') 
            ? "bg-primary-blue/10 text-primary-blue" 
            : "text-gray-700"
        )}
        onClick={() => setOpen(false)}
      >
        Plan Settings
      </Link>
    </nav>
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        
        {isMobile && (
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Settings Menu</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 py-2">
                <NavLinks />
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-52 shrink-0 hidden md:block"> 
          <div className="bg-white rounded-lg shadow p-4">
            <NavLinks />
          </div>
        </div>
        
        <div className="flex-1 w-full overflow-hidden">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
