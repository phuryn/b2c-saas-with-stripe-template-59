
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import our components
import BillingInvoices from '@/components/billing/BillingInvoices';
import UsageStats from '@/components/billing/UsageStats';
import BillingAddress from '@/components/billing/BillingAddress';
import BillingPaymentMethod from '@/components/billing/BillingPaymentMethod';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import SubscriptionInfo from '@/components/billing/SubscriptionInfo';
import PlanCard from '@/components/billing/PlanCard';
import { getPlans } from '@/config/plans';
import { formatPrice } from '@/utils/pricing';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubscription } from '@/hooks/useSubscription';
import { useStripePrices } from '@/hooks/useStripePrices';
import { resetSubscriptionRateLimiting } from '@/utils/subscriptionRateLimit';

const BillingSettings: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Use our subscription hook for consistent behavior with PlanSettings
  const {
    subscription,
    loading,
    refreshing,
    subscriptionLoading,
    refreshSubscriptionData,
    openCustomerPortal,
    handleRenewSubscription
  } = useSubscription();

  // Use the stripe prices hook
  const {
    stripePrices,
    loading: pricesLoading,
  } = useStripePrices();
  
  const [error, setError] = useState<string | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    // Force refresh once when component mounts - this is a billing page
    if (!initialCheckDone && user) {
      console.log("BillingSettings: Initial mount, forcing subscription refresh");
      // Reset rate limiting and force a fresh check
      resetSubscriptionRateLimiting();
      refreshSubscriptionData();
      setInitialCheckDone(true);
    }
    
    // Check URL parameters for subscription status messages
    if (searchParams.get('success') === 'true') {
      toast.success('Your subscription has been updated successfully.');
      resetSubscriptionRateLimiting(); // Reset rate limiting on successful update
      refreshSubscriptionData();
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Subscription update canceled');
    }
  }, [searchParams, refreshSubscriptionData, initialCheckDone, user]);

  const handleManagePlan = () => {
    navigate('/app/settings/plan');
  };

  const getCurrentPlanId = () => {
    if (!subscription?.subscription_tier) return 'free';
    const tier = subscription.subscription_tier.toLowerCase();
    if (tier.includes('standard')) return 'standard';
    if (tier.includes('premium')) return 'premium';
    if (tier.includes('enterprise')) return 'enterprise';
    return 'free';
  };

  const getCurrentCycle = () => {
    if (!subscription) return 'monthly';
    
    // First check if subscription_end is more than 6 months in the future
    // This is a good indicator of a yearly plan
    if (subscription.subscription_end) {
      const endDate = new Date(subscription.subscription_end);
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      
      if (endDate > sixMonthsFromNow) {
        console.log("Yearly plan detected based on end date:", subscription.subscription_end);
        return 'yearly';
      }
    }
    
    // Then check the plan ID if available
    if (subscription.current_plan) {
      const planId = subscription.current_plan.toLowerCase();
      console.log("Current plan ID for cycle detection:", planId);
      
      // Look for common yearly indicators in the plan ID
      if (
        planId.includes('year') || 
        planId.includes('annual') || 
        planId.includes('yr')
      ) {
        return 'yearly';
      }
    }
    
    // For the standard plan price, check if the price is closer to $100 than $10
    // This is a rough check but helps with the specific issue
    if (subscription.subscription_tier === 'Standard') {
      // If we're on plan page and see $100/year, we're on yearly
      const planPage = window.location.pathname.includes('/plan');
      if (planPage && stripePrices) {
        const yearlyPlanId = Object.keys(stripePrices).find(id => 
          id.toLowerCase().includes('standard') && 
          id.toLowerCase().includes('year')
        );
        
        if (yearlyPlanId && stripePrices[yearlyPlanId]?.unit_amount === 10000) {
          console.log("Yearly plan detected based on price match");
          return 'yearly';
        }
      }
    }
    
    // Default to monthly if no yearly indicators are found
    return 'monthly';
  };

  const handleRetry = () => {
    setError(null);
    refreshSubscriptionData();
  };

  const renderErrorState = () => {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetry} 
            className="ml-2"
            disabled={refreshing}
          >
            {refreshing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-1" />}
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  };

  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Loading billing information...</p>
    </div>
  );

  if (loading || pricesLoading) {
    return renderLoadingState();
  }

  const currentPlanId = getCurrentPlanId();
  const currentCycle = getCurrentCycle();
  
  console.log("Determined current cycle:", currentCycle);
  console.log("Current plan ID:", currentPlanId);
  console.log("Subscription current_plan:", subscription?.current_plan);
  
  const plans = getPlans(currentCycle as 'monthly' | 'yearly');
  const currentPlan = plans.find(plan => plan.id === currentPlanId);
  const isSubscriptionCanceling = subscription?.cancel_at_period_end === true;

  return <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Billing and Usage</h2>
        {/* Refresh button removed from here */}
      </div>
      
      {error && renderErrorState()}
      
      {/* Your Plan Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Your Current Plan</h3>
        
        {/* Subscription Info Component */}
        {subscription?.subscribed && <SubscriptionInfo subscription={subscription} onRenewSubscription={isSubscriptionCanceling ? handleRenewSubscription : undefined} subscriptionLoading={subscriptionLoading} />}
        
        {/* Plan Card */}
        {currentPlan && <PlanCard 
          name={currentPlan.name} 
          description={currentPlan.description} 
          price={formatPrice(currentPlan.priceId, currentCycle, stripePrices, plans)} 
          limits={currentPlan.limits} 
          features={currentPlan.features} 
          isActive={false} 
          buttonText={currentPlan.free ? "Upgrade" : "Manage Plan"} 
          onSelect={handleManagePlan} 
          isLoading={subscriptionLoading} 
          inBillingPage={true} 
        />}
      </div>
      
      {/* Monthly Usage Section */}
      <UsageStats subscription={subscription} />
      
      {/* Payment Method Section */}
      <BillingPaymentMethod subscription={subscription} />
      
      {/* Billing Address Section */}
      <BillingAddress subscription={subscription} />
      
      {/* Billing History Section */}
      <BillingInvoices subscription={subscription} />
    </div>;
};

export default BillingSettings;
