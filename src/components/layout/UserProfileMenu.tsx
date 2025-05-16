
import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSubscription } from '@/hooks/useSubscription';
import { getPlans } from '@/config/plans';

interface UserProfileMenuProps {
  onSignOut: () => Promise<void>;
  onUpgrade: () => void;
}

const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ onSignOut, onUpgrade }) => {
  const { user, userMetadata, profile } = useAuth();
  const isMobile = useIsMobile();
  const { subscription, loading: subscriptionLoading } = useSubscription();

  // Helper functions
  const getInitials = () => {
    const name = profile?.display_name || userMetadata?.name || userMetadata?.full_name || user?.email?.split('@')[0] || 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const isFreePlan = () => {
    if (subscriptionLoading) return false;
    return !subscription?.subscribed || !subscription?.subscription_tier;
  };

  const shouldShowUpgradeButton = () => {
    // Default to true if no subscription data
    if (!subscription || !subscription.subscription_tier) return true;

    // Get all plans and find the current one
    try {
      const allPlans = getPlans('monthly');
      const currentPlanId = subscription.subscription_tier?.toLowerCase().includes('standard') 
        ? 'standard' 
        : subscription.subscription_tier?.toLowerCase().includes('premium') 
          ? 'premium' 
          : subscription.subscription_tier?.toLowerCase().includes('enterprise') 
            ? 'enterprise' 
            : 'free';
            
      const currentPlan = allPlans.find(plan => plan.id === currentPlanId);
      // Show upgrade if the plan config says so (defaults to true if not specified)
      return currentPlan?.showUpgrade !== false;
    } catch (e) {
      console.error("Error determining upgrade button visibility:", e);
      return true; // Default to showing the button if there's an error
    }
  };

  const getFormattedPlanName = () => {
    if (subscription?.subscribed && subscription?.subscription_tier) {
      return `${subscription.subscription_tier} Plan`;
    }
    return 'Free Plan';
  };

  const renderUserMenu = () => (
    <div className="w-64 p-2">
      {/* User info section */}
      <div className="flex items-center space-x-3 mb-4 px-2">
        <Avatar className="h-10 w-10">
          <AvatarImage src={userMetadata?.avatar_url} alt={profile?.display_name || user?.email?.split('@')[0] || 'User'} />
          <AvatarFallback>
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium text-base">
            {profile?.display_name || userMetadata?.name || userMetadata?.full_name || user?.email?.split('@')[0] || 'User'}
          </span>
          <span className="text-xs text-gray-500">{user?.email}</span>
        </div>
      </div>

      {/* Separator */}
      <DropdownMenuSeparator className="my-2" />

      {/* Plan section */}
      <div className="px-2 py-1">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {getFormattedPlanName()}
          </span>
          {shouldShowUpgradeButton() && (
            <Link to="/app/settings/plan" className="text-xs px-2 py-1 bg-primary-blue text-white rounded hover:bg-primary-blue/90 transition-colors font-medium">
              Upgrade
            </Link>
          )}
        </div>
      </div>

      {/* Separator */}
      <DropdownMenuSeparator className="my-2" />

      {/* Settings link */}
      <Link to="/app/settings" className="block w-full text-left px-2 py-2 rounded-md text-gray-700 hover:bg-gray-100">
        Settings
      </Link>
      
      {/* Sign out */}
      <button onClick={onSignOut} className="block w-full text-left px-2 py-2 rounded-md text-red-600 hover:bg-red-50">
        Sign Out
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex items-center gap-3 pt-6 pr-0 pb-0 pl-0">
        {/* Show Upgrade button on mobile too */}
        {isFreePlan() && shouldShowUpgradeButton() && (
          <Button 
            onClick={onUpgrade} 
            size="sm" 
            className="bg-primary-blue hover:bg-primary-blue/90 text-white"
          >
            Upgrade
          </Button>
        )}
        
        <Popover>
          <PopoverTrigger asChild>
            <button className="focus:outline-none">
              <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarImage src={userMetadata?.avatar_url} alt={profile?.display_name || user?.email?.split('@')[0] || 'User'} />
                <AvatarFallback>
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-64" align="end">
            {renderUserMenu()}
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 pt-6 pr-0 pb-0 pl-0">
      {/* Upgrade button for free plans */}
      {isFreePlan() && shouldShowUpgradeButton() && (
        <Button 
          onClick={onUpgrade} 
          size="sm" 
          className="bg-primary-blue hover:bg-primary-blue/90 text-white"
        >
          Upgrade
        </Button>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus:outline-none">
            <Avatar className="h-9 w-9 cursor-pointer">
              <AvatarImage src={userMetadata?.avatar_url} alt={profile?.display_name || user?.email?.split('@')[0] || 'User'} />
              <AvatarFallback>
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {renderUserMenu()}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserProfileMenu;
