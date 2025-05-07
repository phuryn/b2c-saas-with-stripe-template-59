
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import { STRIPE_CONFIG } from '@/config/stripe';
import { Button } from '@/components/ui/button';

// Import our components
import BillingInvoices from '@/components/billing/BillingInvoices';
import UsageStats from '@/components/billing/UsageStats';
import BillingAddress from '@/components/billing/BillingAddress';
import BillingPaymentMethod from '@/components/billing/BillingPaymentMethod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  interval?: string;
}

const BillingSettings: React.FC = () => {
  const { user, session } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
      toast({
        title: 'Subscription Updated',
        description: 'Your subscription has been updated successfully.',
      });
      checkSubscriptionStatus();
    } else if (searchParams.get('canceled') === 'true') {
      toast({
        description: 'Subscription update canceled.',
      });
    }
  }, [searchParams, toast]);

  const fetchStripePrices = async () => {
    try {
      setPricesLoading(true);
      // Collect all price IDs
      const priceIds = [
        STRIPE_CONFIG.prices.standard.monthly,
        STRIPE_CONFIG.prices.standard.yearly,
        STRIPE_CONFIG.prices.premium.monthly,
        STRIPE_CONFIG.prices.premium.yearly
      ];
      
      const { data, error } = await supabase.functions.invoke('get-prices', {
        body: { priceIds: priceIds.join(',') }
      });
      
      if (error) throw new Error(error.message);
      
      // Create a map of price IDs to price data
      const priceMap: Record<string, StripePrice> = {};
      data.prices.forEach((price: StripePrice) => {
        priceMap[price.id] = price;
      });
      
      setStripePrices(priceMap);
    } catch (err) {
      console.error('Error fetching prices from Stripe:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch pricing information from Stripe.',
        variant: 'destructive',
      });
    } finally {
      setPricesLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log('Subscription data from API:', data); // Log the subscription data
      setSubscription(data);
    } catch (err) {
      console.error('Error checking subscription status:', err);
      toast({
        title: 'Error',
        description: 'Failed to retrieve subscription information.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openCustomerPortal = async () => {
    try {
      setSubscriptionLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw new Error(error.message);
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Error opening customer portal:', err);
      toast({
        title: 'Error',
        description: 'Failed to open customer portal.',
        variant: 'destructive',
      });
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
    if (!subscription) return { name: 'Free', price: '$0/month' };
    
    const tier = subscription.subscription_tier || 'Free';
    
    if (tier === 'Free' || !subscription.subscribed) {
      return { name: 'Free', price: '$0/month' };
    }
    
    // Determine if plan is monthly or yearly
    const isYearly = subscription.current_plan?.includes('yearly');
    const planType = tier.toLowerCase() as 'standard' | 'premium';
    const priceId = isYearly 
      ? STRIPE_CONFIG.prices[planType]?.yearly
      : STRIPE_CONFIG.prices[planType]?.monthly;
    
    const price = stripePrices[priceId];
    const formattedPrice = price 
      ? `${formatPriceDisplay(price.unit_amount, price.currency)}/${isYearly ? 'year' : 'month'}`
      : `${'$' + (tier === 'Standard' ? '29' : '79')}/${isYearly ? 'year' : 'month'}`;
    
    return { name: tier, price: formattedPrice };
  };

  if (loading || pricesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const planDetails = getPlanDetails();
  const isSubscriptionCanceling = subscription?.cancel_at_period_end === true;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Billing and Usage</h2>
        {subscription?.subscribed && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={checkSubscriptionStatus}
            disabled={refreshing}
            className="transition-all hover:bg-primary/10"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        )}
      </div>
      
      {/* Current Plan Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Your Plan</h3>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">{planDetails.name} Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-2xl font-bold">{planDetails.price}</p>
              <p className="text-gray-500 text-sm mt-1">
                {subscription?.subscription_end && subscription.subscribed ? 
                  isSubscriptionCanceling ?
                    `Cancels on ${formatDate(subscription.subscription_end)}` :
                    `Next billing date: ${formatDate(subscription.subscription_end)}` : 
                  'No active subscription'}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={handleManagePlan}
                className="w-full md:w-auto"
                variant="default"
              >
                Manage Plan
              </Button>
              {subscription?.subscribed && (
                <Button 
                  onClick={openCustomerPortal}
                  className="w-full md:w-auto"
                  variant="outline"
                  disabled={subscriptionLoading}
                >
                  {subscriptionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Customer Portal
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Monthly Usage Section */}
      <UsageStats subscription={subscription} />
      
      {/* Payment Method Section - New component */}
      <BillingPaymentMethod subscription={subscription} />
      
      {/* Billing Address Section */}
      <BillingAddress subscription={subscription} />
      
      {/* Billing History Section */}
      <BillingInvoices subscription={subscription} />
    </div>
  );
};

export default BillingSettings;
