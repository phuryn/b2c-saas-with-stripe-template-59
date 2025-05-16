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
import { resetSubscriptionRateLimiting } from '@/utils/subscriptionRateLimit';
import { STRIPE_CONFIG } from '@/config/stripe';

const PlanSettings: React.FC = () => {
  const { user, session } = useAuth();
  const [searchParams] = useSearchParams();
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('yearly'); // Default to yearly
  const [initialized, setInitialized] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  
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
    handleRenewSubscription
  } = useSubscription();
  
  const {
    stripePrices,
    loading: pricesLoading,
  } = useStripePrices();

  // Initial load - force refresh subscription once
  useEffect(() => {
    if (session && !initialCheckDone) {
      // Reset rate limiting and force a fresh check for the plans page
      resetSubscriptionRateLimiting();
      checkSubscriptionStatus(true); // Force a check to ensure we have the latest data
      setInitialCheckDone(true);
    }
  }, [session, initialCheckDone]);

  // Get the current cycle based on the subscription plan
  const getCurrentCycle = (): BillingCycle => {
    if (!subscription?.current_plan) return 'yearly'; // Default to yearly for free users
    
    // Debug to see what's in the current plan
    console.log('Current plan value:', subscription.current_plan);
    
    // Check if the current plan matches any of our yearly price IDs
    if (subscription.current_plan === STRIPE_CONFIG.prices.standard.yearly || 
        subscription.current_plan === STRIPE_CONFIG.prices.premium.yearly) {
      console.log("Detected yearly plan based on price ID match with config");
      return 'yearly';
    }
    
    // All other plans are assumed to be monthly
    return 'monthly';
  };

  // Set the initial cycle based on subscription data OR default to yearly for free users
  useEffect(() => {
    // If subscription data is loaded (regardless of subscribed status)
    if (subscription && !initialized) {
      if (subscription.subscribed && subscription.current_plan) {
        // For paid users: get cycle from subscription
        const currentCycle = getCurrentCycle();
        console.log('Setting initial cycle based on subscription to:', currentCycle);
        setSelectedCycle(currentCycle);
      } else {
        // For free users: default to yearly
        console.log('Free user - defaulting to yearly cycle');
        setSelectedCycle('yearly');
      }
      setInitialized(true);
    }
  }, [subscription, initialized]);

  // Reset initialization if subscription changes
  useEffect(() => {
    if (!subscription) {
      setInitialized(false);
    }
  }, [subscription]);

  // Check URL parameters for success message after checkout completion
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription updated successfully');
      resetSubscriptionRateLimiting(); // Reset rate limiting on successful update
      checkSubscriptionStatus(true); // Force a fresh check
      setInitialized(false); // Reset initialized state to force cycle detection
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Subscription update canceled');
    }
  }, [searchParams]);

  // Handle plan selection with automatic refresh
  const handlePlanSelection = async (planId: string, cycle: 'monthly' | 'yearly') => {
    console.log('Selecting plan with cycle:', cycle);
    const result = await handleSelectPlan(planId, cycle);
    if (result && result.success) {
      toast.success('Plan updated successfully');
      
      // Update the cycle in the UI immediately
      if (result.cycle) {
        console.log('Updating cycle after plan selection to:', result.cycle);
        setSelectedCycle(result.cycle);
      }
      
      // Reset rate limiting and force refresh
      resetSubscriptionRateLimiting();
      await refreshSubscriptionData(); 
    }
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
      resetSubscriptionRateLimiting(); // Reset rate limiting after downgrade
      await refreshSubscriptionData();
    }
  };

  // Handle renewal with automatic refresh
  const handleRenewal = async () => {
    const success = await handleRenewSubscription();
    if (success) {
      toast.success('Subscription renewed successfully');
      resetSubscriptionRateLimiting(); // Reset rate limiting after renewal
      await refreshSubscriptionData();
    }
    return success;
  };

  const getCurrentPlanId = () => {
    if (!subscription?.current_plan) return null;
    
    // Check for standard plan (using the proper price IDs)
    if (subscription.current_plan === STRIPE_CONFIG.prices.standard.monthly ||
        subscription.current_plan === STRIPE_CONFIG.prices.standard.yearly) {
        console.log("Detected standard plan based on price ID match with config");
        return 'standard'; 
    }
    
    // Check for premium plan (using the proper price IDs)
    if (subscription.current_plan === STRIPE_CONFIG.prices.premium.monthly ||
        subscription.current_plan === STRIPE_CONFIG.prices.premium.yearly) {
        console.log("Detected premium plan based on price ID match with config");
        return 'premium';
    }
    
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
  
  return (
    <div className="space-y-8">
      <SubscriptionHeader />
      
      {/* Subscription Info */}
      {subscription?.subscribed && (
        <SubscriptionInfo
          subscription={subscription}
          onRenewSubscription={isSubscriptionCanceling ? handleRenewal : undefined}
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
          showDowngrade={Boolean(subscription?.subscribed) && !isSubscriptionCanceling}
          onDowngrade={handleDowngradeClick}
          onCycleChange={handleCycleChange}
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
