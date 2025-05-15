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

const PlanSettings: React.FC = () => {
  const { user, session } = useAuth();
  const [searchParams] = useSearchParams();
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  
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

  useEffect(() => {
    if (session) {
      checkSubscriptionStatus();
    }
  }, [session]);

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
    const success = await handleSelectPlan(planId, cycle);
    if (success) {
      toast.success('Plan updated successfully');
      await refreshSubscriptionData(); // Refresh subscription data after successful plan change
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

  const getCurrentPlanId = () => {
    if (!subscription?.current_plan) return null;
    
    if (subscription.current_plan.includes('standard')) return 'standard';
    if (subscription.current_plan.includes('premium')) return 'premium';
    if (subscription.current_plan.includes('enterprise')) return 'enterprise';
    return null;
  };
  
  const getCurrentCycle = (): BillingCycle => {
    if (!subscription?.current_plan) return 'monthly';
    return subscription.current_plan.includes('yearly') ? 'yearly' : 'monthly';
  };

  if (subscriptionLoading || pricesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentCycle = getCurrentCycle();
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
          cycle={currentCycle}
          onSelect={handlePlanSelection}
          priceData={stripePrices}
          showDowngrade={Boolean(subscription?.subscribed) && !isSubscriptionCanceling}
          onDowngrade={handleDowngradeClick}
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
