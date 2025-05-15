
// We cannot modify PlanCard.tsx directly as it's marked as read-only, 
// so we'll create a helper hook to handle this functionality

import { toast } from '@/hooks/use-toast';

// This is just a wrapper since we can't modify the actual component
// You'll need to use the disabled prop in your own implementation
export const usePlanCardHelpers = () => {
  const handleDisabledPlanClick = () => {
    toast.info("You have a pending plan change. Please cancel it first before making new changes.");
  };
  
  return {
    handleDisabledPlanClick
  };
};
