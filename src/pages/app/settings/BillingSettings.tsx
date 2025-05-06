
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { STRIPE_CONFIG } from '@/config/stripe';

// Import our components
import PlanSelector from '@/components/billing/PlanSelector';
import BillingDetails from '@/components/billing/BillingDetails';
import BillingHistory from '@/components/billing/BillingHistory';
import UsageStats from '@/components/billing/UsageStats';
import BillingAddress from '@/components/billing/BillingAddress';

interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  interval?: string;
}

const BillingSettings: React.FC = () => {
  const { user, session } = useAuth();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscription, setSubscription] = useState<{
    subscribed: boolean;
    subscription_tier: string | null;
    subscription_end: string | null;
    current_plan: string | null;
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
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        throw new Error(error.message);
      }
      
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
    }
  };

  const handleSubscribe = async (planId: string) => {
    const priceId = subscription?.current_plan?.includes('yearly') 
      ? STRIPE_CONFIG.prices[planId as 'standard' | 'premium']?.yearly
      : STRIPE_CONFIG.prices[planId as 'standard' | 'premium']?.monthly;
      
    if (!priceId) {
      toast({
        title: 'Error',
        description: 'Invalid price ID.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubscriptionLoading(true);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });
      
      if (error) throw new Error(error.message);
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      toast({
        title: 'Error',
        description: 'Failed to initialize checkout.',
        variant: 'destructive',
      });
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleUpdateSubscription = async (planId: string) => {
    if (planId === 'free') {
      toast({
        title: 'Free Plan',
        description: 'To downgrade to the free plan, please cancel your subscription in the customer portal.',
      });
      openCustomerPortal();
      return;
    }
    
    if (!subscription?.subscribed) {
      return handleSubscribe(planId);
    }
    
    const priceId = subscription?.current_plan?.includes('yearly') 
      ? STRIPE_CONFIG.prices[planId as 'standard' | 'premium']?.yearly
      : STRIPE_CONFIG.prices[planId as 'standard' | 'premium']?.monthly;
      
    if (!priceId) {
      toast({
        title: 'Error',
        description: 'Invalid price ID.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setSubscriptionLoading(true);
      const { data, error } = await supabase.functions.invoke('update-subscription', {
        body: { newPriceId: priceId }
      });
      
      if (error) throw new Error(error.message);
      
      toast({
        title: 'Success',
        description: 'Your subscription has been updated.',
      });
      
      checkSubscriptionStatus();
    } catch (err) {
      console.error('Error updating subscription:', err);
      toast({
        title: 'Error',
        description: 'Failed to update subscription.',
        variant: 'destructive',
      });
    } finally {
      setSubscriptionLoading(false);
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

  if (loading || pricesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-medium mb-4">Billing and Usage</h2>
      
      {/* Plans Selection Section */}
      <PlanSelector
        subscription={subscription}
        stripePrices={stripePrices}
        loading={subscriptionLoading}
        onSubscribe={handleSubscribe}
        onUpdateSubscription={handleUpdateSubscription}
      />
      
      {/* Monthly Usage Section */}
      <UsageStats subscription={subscription} />
      
      {/* Billing Details Section - Always shown, content differs based on subscription status */}
      <BillingDetails 
        subscription={subscription} 
        loading={subscriptionLoading} 
        onOpenCustomerPortal={openCustomerPortal} 
      />
      
      {/* Billing Address Section */}
      <BillingAddress subscription={subscription} />
      
      {/* Billing History Section - Will only show if invoices are found */}
      <BillingHistory subscription={subscription} />
    </div>
  );
};

export default BillingSettings;
