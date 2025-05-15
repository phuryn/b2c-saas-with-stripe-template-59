
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { STRIPE_CONFIG } from '@/config/stripe';
import { Button } from '@/components/ui/button';

// Import our components
import BillingInvoices from '@/components/billing/BillingInvoices';
import UsageStats from '@/components/billing/UsageStats';
import BillingAddress from '@/components/billing/BillingAddress';
import BillingPaymentMethod from '@/components/billing/BillingPaymentMethod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SubscriptionInfo from '@/components/billing/SubscriptionInfo';
import PlanCard from '@/components/billing/PlanCard';
import { getPlans } from '@/config/plans';
import { formatPrice } from '@/utils/pricing';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  interval?: string;
}

const BillingSettings: React.FC = () => {
  const {
    user,
    session
  } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<{
    subscribed: boolean;
    subscription_tier: string | null;
    subscription_end: string | null;
    current_plan: string | null;
    cancel_at_period_end?: boolean;
    payment_method?: {
      brand?: string;
      last4?: string;
      exp_month?: number;
      exp_year?: number;
    } | null;
    billing_address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
      tax_id?: string;
    } | null;
  } | null>(null);
  const [stripePrices, setStripePrices] = useState<Record<string, StripePrice>>({});

  useEffect(() => {
    fetchStripePrices();
  }, []);

  useEffect(() => {
    if (session) {
      checkSubscriptionStatus();
    }
  }, [session]);

  useEffect(() => {
    // Check URL parameters for subscription status messages
    if (searchParams.get('success') === 'true') {
      toast.success('Your subscription has been updated successfully.');
      checkSubscriptionStatus();
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Subscription update canceled');
    }
  }, [searchParams]);

  const fetchStripePrices = async () => {
    try {
      setPricesLoading(true);
      // Collect all price IDs
      const priceIds = [STRIPE_CONFIG.prices.standard.monthly, STRIPE_CONFIG.prices.standard.yearly, STRIPE_CONFIG.prices.premium.monthly, STRIPE_CONFIG.prices.premium.yearly];
      const { data, error } = await supabase.functions.invoke('get-prices', {
        body: {
          priceIds: priceIds.join(',')
        }
      });
      
      if (error) throw new Error(error.message || 'Failed to fetch pricing information');

      // Create a map of price IDs to price data
      const priceMap: Record<string, StripePrice> = {};
      data.prices.forEach((price: StripePrice) => {
        priceMap[price.id] = price;
      });
      setStripePrices(priceMap);
      setError(null);
    } catch (err) {
      console.error('Error fetching prices from Stripe:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to fetch pricing information: ${errorMessage}`);
      toast.error('Failed to fetch pricing information from Stripe.');
    } finally {
      setPricesLoading(false);
    }
  };

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        throw new Error(error.message || 'Failed to retrieve subscription information');
      }
      
      console.log('Subscription data from API:', data); // Log the subscription data
      setSubscription(data);
    } catch (err) {
      console.error('Error checking subscription status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to retrieve subscription information: ${errorMessage}`);
      
      toast.error('Failed to retrieve subscription information.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const openCustomerPortal = async () => {
    try {
      setSubscriptionLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw new Error(error.message || 'Failed to open customer portal');
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (err) {
      console.error('Error opening customer portal:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`Failed to open customer portal: ${errorMessage}`);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleManagePlan = () => {
    navigate('/app/settings/plan');
  };

  const formatPriceDisplay = (price: number | undefined, currency: string = 'usd'): string => {
    if (price === undefined) return '$0';

    // Convert cents to dollars
    const dollars = price / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: dollars % 1 === 0 ? 0 : 2
    }).format(dollars);
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlanDetails = () => {
    if (!subscription) return {
      name: 'Free',
      price: '$0/month'
    };
    const tier = subscription.subscription_tier || 'Free';
    if (tier === 'Free' || !subscription.subscribed) {
      return {
        name: 'Free',
        price: '$0/month'
      };
    }

    // Determine if plan is monthly or yearly
    const isYearly = subscription.current_plan?.includes('yearly');
    const planType = tier.toLowerCase() as 'standard' | 'premium';
    const priceId = isYearly ? STRIPE_CONFIG.prices[planType]?.yearly : STRIPE_CONFIG.prices[planType]?.monthly;
    const price = stripePrices[priceId];
    const formattedPrice = price ? `${formatPriceDisplay(price.unit_amount, price.currency)}/${isYearly ? 'year' : 'month'}` : `${'$' + (tier === 'Standard' ? '10' : '20')}/${isYearly ? 'year' : 'month'}`;
    return {
      name: tier,
      price: formattedPrice
    };
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
    checkSubscriptionStatus();
  };

  const handleRenewSubscription = async () => {
    try {
      setSubscriptionLoading(true);
      const { data, error } = await supabase.functions.invoke('update-subscription', {
        body: { renew: true }
      });
      
      if (error) throw new Error(error.message || 'Failed to renew subscription');
      
      if (data?.success) {
        toast.success("Your subscription has been successfully renewed.");
        await checkSubscriptionStatus();
      }
    } catch (err) {
      console.error('Error renewing subscription:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`Failed to renew subscription: ${errorMessage}`);
    } finally {
      setSubscriptionLoading(false);
    }
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

  const planDetails = getPlanDetails();
  const isSubscriptionCanceling = subscription?.cancel_at_period_end === true;
  const currentPlanId = getCurrentPlanId();
  const currentCycle = getCurrentCycle();
  const plans = getPlans(currentCycle as 'monthly' | 'yearly');
  const currentPlan = plans.find(plan => plan.id === currentPlanId);

  return <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Billing and Usage</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRetry}
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
