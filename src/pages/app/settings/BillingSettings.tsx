import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
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

  useEffect(() => {
    // Check URL parameters for subscription status messages
    if (searchParams.get('success') === 'true') {
      toast.success('Your subscription has been updated successfully.');
      refreshSubscriptionData();
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Subscription update canceled');
    }
  }, [searchParams, refreshSubscriptionData]);

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
    if (!subscription?.current_plan) return 'monthly';
    return subscription.current_plan.includes('yearly') ? 'yearly' : 'monthly';
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
            {refreshing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  };

  if (loading || pricesLoading) {
    return <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }

  const currentPlanId = getCurrentPlanId();
  const currentCycle = getCurrentCycle();
  const plans = getPlans(currentCycle as 'monthly' | 'yearly');
  const currentPlan = plans.find(plan => plan.id === currentPlanId);
  const isSubscriptionCanceling = subscription?.cancel_at_period_end === true;

  return <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Billing and Usage</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={refreshSubscriptionData}
          disabled={refreshing}
        >
          {refreshing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Refresh
        </Button>
      </div>
      
      {error && renderErrorState()}
      
      {/* Your Plan Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Your Current Plan</h3>
        
        {/* Subscription Info Component */}
        {subscription?.subscribed && <SubscriptionInfo subscription={subscription} onRenewSubscription={isSubscriptionCanceling ? handleRenewSubscription : undefined} subscriptionLoading={subscriptionLoading} />}
        
        {/* Plan Card */}
        {currentPlan && <PlanCard name={currentPlan.name} description={currentPlan.description} price={currentPlan.free ? 'Free' : formatPrice(currentPlan.priceId, currentCycle, stripePrices, plans)} limits={currentPlan.limits} features={currentPlan.features} isActive={false} buttonText={currentPlan.free ? "Upgrade" : "Manage Plan"} onSelect={handleManagePlan} isLoading={subscriptionLoading} inBillingPage={true} />}
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
