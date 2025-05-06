import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { STRIPE_CONFIG } from '@/config/stripe';
import PlanSelector from '@/components/billing/PlanSelector';

interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  interval?: string;
}

const PlanSettings: React.FC = () => {
  const { user, session } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
    // Redirect all subscription actions to Stripe portal
    openCustomerPortal();
  };

  const handleUpdateSubscription = async (planId: string) => {
    // Redirect all subscription updates to Stripe portal
    openCustomerPortal();
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
      <h2 className="text-xl font-medium mb-4">Select Your Plan</h2>
      
      {/* Plans Selection Section */}
      <div className="overflow-x-auto -mx-6 md:mx-0">
        <div className="min-w-[800px] md:min-w-0 px-6 md:px-0">
          <PlanSelector
            subscription={subscription}
            stripePrices={stripePrices}
            loading={subscriptionLoading}
            onSubscribe={handleSubscribe}
            onUpdateSubscription={handleUpdateSubscription}
          />
        </div>
      </div>
    </div>
  );
};

export default PlanSettings;
