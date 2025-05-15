
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PlanSelector from '@/components/billing/PlanSelector';
import { useSubscription } from '@/hooks/useSubscription';
import { useStripePrices } from '@/hooks/useStripePrices';
import SubscriptionHeader from '@/components/billing/SubscriptionHeader';
import SubscriptionInfo from '@/components/billing/SubscriptionInfo';
import DowngradeDialog from '@/components/billing/DowngradeDialog';
import { BillingCycle } from '@/types/subscription';
import { getPlans } from '@/config/plans';

const PlanSettings: React.FC = () => {
  const { user, session } = useAuth();
  const [searchParams] = useSearchParams();
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('yearly'); // Default to yearly
  const [initialized, setInitialized] = useState(false);
  
  // Use our custom hooks
  const {
    subscription,
    loading: subscriptionLoading,
    refreshing,
    subscriptionLoading: actionLoading,
    checkSubscriptionStatus,
    refreshSubscriptionData,
    handleSelectPlan,
    openCustomerPortal,
    handleDowngrade,
    handleRenewSubscription,
    handleCancelPendingChange
  } = useSubscription();
  
  const {
    stripePrices,
    loading: pricesLoading,
  } = useStripePrices();

  useEffect(() => {
    if (session) {
      checkSubscriptionStatus(true); // Force a check to ensure we have the latest data
    }
  }, [session]);

  // Get the current cycle based on the subscription plan
  const getCurrentCycle = (): BillingCycle => {
    if (!subscription?.current_plan) return 'yearly'; // Default to yearly
    
    // Debug to see what's in the current plan
    console.log('Current plan value:', subscription.current_plan);
    
    // Check for yearly with more robust detection, since price_1RLoScLdL9hht8n4hSQtsOte doesn't explicitly contain 'yearly'
    // From the edge function logs we can see this corresponds to a yearly plan
    if (subscription.current_plan === 'price_1RLoScLdL9hht8n4hSQtsOte') {
      return 'yearly';
    }
    
    // Fallback to standard check
    return subscription.current_plan.includes('yearly') || 
           subscription.current_plan.includes('annual') ? 'yearly' : 'monthly';
  };

  // Set the initial cycle based on subscription data BEFORE rendering the component
  useEffect(() => {
    if (subscription?.subscribed && subscription?.current_plan && !initialized) {
      const currentCycle = getCurrentCycle();
      console.log('Setting initial cycle based on subscription to:', currentCycle);
      setSelectedCycle(currentCycle);
      setInitialized(true);
    }
  }, [subscription]);

  // Reset initialization if subscription changes
  useEffect(() => {
    if (!subscription) {
      setInitialized(false);
    }
  }, [subscription]);

  useEffect(() => {
    // Check URL parameters for subscription status messages
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription updated successfully');
      checkSubscriptionStatus();
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Subscription update canceled');
    }
  }, [searchParams]);

  // Handle plan selection with automatic refresh
  const handlePlanSelection = async (planId: string, cycle: 'monthly' | 'yearly') => {
    // Determine if we should schedule change for end of cycle
    const shouldScheduleForEndOfCycle = determineIfScheduleNeeded(planId, cycle);
    
    const result = await handleSelectPlan(planId, cycle, {
      scheduleForEndOfCycle: shouldScheduleForEndOfCycle
    });
    
    if (result && result.success) {
      if (shouldScheduleForEndOfCycle) {
        toast.success('Plan change scheduled for the end of your current billing cycle');
      } else {
        toast.success('Plan updated successfully');
      }
      
      // Update the cycle in the UI immediately
      if (result.cycle) {
        console.log('Updating cycle after plan selection to:', result.cycle);
        setSelectedCycle(result.cycle);
      }
      
      await refreshSubscriptionData(); // Refresh subscription data after successful plan change
    }
  };
  
  // Helper function to determine if a change should be scheduled
  const determineIfScheduleNeeded = (newPlanId: string, newCycle: 'monthly' | 'yearly'): boolean => {
    if (!subscription?.current_plan) return false;
    
    const currentPlanId = subscription.current_plan;
    const currentCycle = getCurrentCycle();
    
    // 1. Is this a billing cycle change? (monthly to yearly or vice versa)
    if (currentCycle !== newCycle) {
      return true;
    }
    
    // 2. Is this a downgrade? (premium to standard)
    if (
      (currentPlanId.includes('premium') && newPlanId.includes('standard')) ||
      (stripePrices[currentPlanId]?.unit_amount > stripePrices[newPlanId]?.unit_amount)
    ) {
      return true;
    }
    
    return false;
  };

  // Handle downgrade with automatic refresh
  const handleDowngradeClick = () => {
    setShowDowngradeDialog(true);
  };

  const confirmDowngrade = async () => {
    const success = await handleDowngrade();
    if (success) {
      toast.success('Subscription cancelled successfully');
      setShowDowngradeDialog(false);
      await refreshSubscriptionData(); // Refresh subscription data after downgrade
    }
  };

  // Handle renewal with automatic refresh
  const handleRenewal = async () => {
    const success = await handleRenewSubscription();
    if (success) {
      toast.success('Subscription renewed successfully');
      await refreshSubscriptionData(); // Refresh subscription data after renewal
    }
    return success;
  };
  
  // Handle cancelling pending changes
  const handleCancelChange = async () => {
    const success = await handleCancelPendingChange();
    if (success) {
      toast.success('Pending change cancelled successfully');
      await refreshSubscriptionData(); // Refresh subscription data after cancelling
    }
    return success;
  };

  const getCurrentPlanId = () => {
    if (!subscription?.current_plan) return null;
    
    if (subscription.current_plan.includes('standard')) return 'standard';
    if (subscription.current_plan.includes('premium')) return 'premium';
    if (subscription.current_plan.includes('enterprise')) return 'enterprise';
    return null;
  };

  // Handler for cycle changes in PlanSelector
  const handleCycleChange = (cycle: 'monthly' | 'yearly') => {
    console.log('Cycle changed to:', cycle);
    setSelectedCycle(cycle);
  };

  if (subscriptionLoading || pricesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSubscriptionCanceling = subscription?.cancel_at_period_end === true;
  const hasPendingChange = subscription?.pending_change && subscription.pending_change.type;
  
  return (
    <div className="space-y-8">
      <SubscriptionHeader />
      
      {/* Subscription Info */}
      {subscription?.subscribed && (
        <SubscriptionInfo
          subscription={subscription}
          onRenewSubscription={isSubscriptionCanceling && !hasPendingChange ? handleRenewal : undefined}
          onCancelPendingChange={hasPendingChange ? handleCancelChange : undefined}
          subscriptionLoading={actionLoading}
        />
      )}
      
      {!subscription?.subscribed && (
        <div className="bg-muted/50 rounded-lg p-4 border border-muted-foreground/20">
          <p className="text-sm text-muted-foreground">You are a free subscriber.</p>
        </div>
      )}
      
      {/* Plans Selection Section */}
      <div>
        <PlanSelector
          currentPlan={subscription?.current_plan}
          isLoading={actionLoading || isSubscriptionCanceling}
          cycle={selectedCycle}
          onSelect={handlePlanSelection}
          priceData={stripePrices}
          showDowngrade={Boolean(subscription?.subscribed) && !isSubscriptionCanceling && !hasPendingChange}
          onDowngrade={handleDowngradeClick}
          onCycleChange={handleCycleChange}
          disableControls={Boolean(hasPendingChange)}
        />
      </div>
      
      {/* Downgrade Dialog */}
      <DowngradeDialog
        open={showDowngradeDialog}
        onOpenChange={setShowDowngradeDialog}
        onConfirm={confirmDowngrade}
        loading={actionLoading}
      />
    </div>
  );
};

export default PlanSettings;
