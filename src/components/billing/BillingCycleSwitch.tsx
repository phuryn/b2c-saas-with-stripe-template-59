
// Since BillingCycleSwitch.tsx is marked as read-only, 
// create a helper hook to handle disabled state

import { toast } from '@/hooks/use-toast';

export const useBillingSwitchHelpers = () => {
  const handleDisabledCycleChange = () => {
    toast.info("You have a pending plan change. Please cancel it first before changing billing cycle.");
  };
  
  return {
    handleDisabledCycleChange
  };
};
