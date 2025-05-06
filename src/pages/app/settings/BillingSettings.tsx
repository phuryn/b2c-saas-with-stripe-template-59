
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { STRIPE_CONFIG } from '@/config/stripe';

interface PlanOption {
  id: string;
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyPriceId: string;
  yearlyPriceId: string;
  description: string;
  features: string[];
  popular?: boolean;
  isFree?: boolean;
}

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
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [subscription, setSubscription] = useState<{
    subscribed: boolean;
    subscription_tier: string | null;
    subscription_end: string | null;
    current_plan: string | null;
  } | null>(null);
  const [stripePrices, setStripePrices] = useState<Record<string, StripePrice>>({});
  
  const plans: PlanOption[] = [
    {
      id: "free",
      name: "Free",
      monthlyPrice: "$0",
      yearlyPrice: "$0",
      monthlyPriceId: "", // No price ID for free plan
      yearlyPriceId: "", // No price ID for free plan
      description: "Basic functionality for personal use.",
      features: ["1 project", "5 links", "Basic analytics", "Email support"],
      isFree: true,
    },
    {
      id: "standard",
      name: "Standard",
      monthlyPrice: "$9",
      yearlyPrice: "$90",
      monthlyPriceId: STRIPE_CONFIG.prices.standard.monthly,
      yearlyPriceId: STRIPE_CONFIG.prices.standard.yearly,
      description: "Great for professionals and small teams.",
      features: ["10 projects", "Unlimited links", "Advanced analytics", "Priority support", "API access"],
    },
    {
      id: "premium",
      name: "Premium",
      monthlyPrice: "$19",
      yearlyPrice: "$190",
      monthlyPriceId: STRIPE_CONFIG.prices.premium.monthly,
      yearlyPriceId: STRIPE_CONFIG.prices.premium.yearly,
      description: "Full-featured solution for businesses.",
      features: ["Unlimited projects", "Unlimited links", "Custom analytics", "24/7 support", "API access", "White-labeling", "Custom integrations"],
      popular: true,
    },
  ];

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
        query: { priceIds: priceIds.join(',') }
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
    const priceId = billingPeriod === 'monthly' 
      ? plans.find(p => p.id === planId)?.monthlyPriceId
      : plans.find(p => p.id === planId)?.yearlyPriceId;
      
    if (!priceId) {
      if (plans.find(p => p.id === planId)?.isFree) {
        toast({
          title: 'Free Plan',
          description: 'You are using the free plan. No payment required.',
        });
        return;
      }
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
    if (plans.find(p => p.id === planId)?.isFree) {
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
    
    const priceId = billingPeriod === 'monthly' 
      ? plans.find(p => p.id === planId)?.monthlyPriceId
      : plans.find(p => p.id === planId)?.yearlyPriceId;
      
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

  const isPlanActive = (planName: string): boolean => {
    if (!subscription?.subscribed) return planName === "Free";
    return subscription.subscription_tier === planName;
  };

  const formatCurrency = (amount: number | undefined, currency: string = 'usd'): string => {
    if (amount === undefined) return '$0';
    
    // Convert cents to dollars
    const dollars = amount / 100;
    
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency.toUpperCase(),
      minimumFractionDigits: dollars % 1 === 0 ? 0 : 2
    }).format(dollars);
  };

  const getPrice = (plan: PlanOption): string => {
    if (plan.isFree) return "$0";
    
    const priceId = billingPeriod === 'monthly' ? plan.monthlyPriceId : plan.yearlyPriceId;
    const price = stripePrices[priceId];
    
    if (!price) {
      return billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    }
    
    return formatCurrency(price.unit_amount, price.currency);
  };

  const getPricePeriod = (): string => {
    return billingPeriod === 'monthly' ? '/month' : '/year';
  };

  if (loading || pricesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium mb-4">Billing and Usage</h2>
      
      <div className="flex flex-col space-y-6">
        {subscription?.subscribed && (
          <div className="mb-0">
            <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Current Plan:</span> {subscription.subscription_tier}
                {subscription.subscription_end && (
                  <> · Renews on {new Date(subscription.subscription_end).toLocaleDateString()}</>
                )}
              </p>
            </div>
            
            <Button 
              variant="outline" 
              onClick={openCustomerPortal}
              disabled={subscriptionLoading}
              className="mb-6"
            >
              {subscriptionLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</>
              ) : (
                'Manage Subscription & Billing'
              )}
            </Button>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Available Plans</h3>
          <div className="flex items-center space-x-2">
            <Label htmlFor="billing-period" className={`text-sm ${billingPeriod === 'monthly' ? 'font-medium' : ''}`}>
              Monthly
            </Label>
            <Switch 
              id="billing-period" 
              checked={billingPeriod === 'yearly'}
              onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
            />
            <Label htmlFor="billing-period" className={`text-sm ${billingPeriod === 'yearly' ? 'font-medium' : ''}`}>
              Yearly <span className="text-green-600 font-medium">(Save 16%)</span>
            </Label>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`overflow-hidden ${isPlanActive(plan.name) ? 'border-primary-blue border-2' : ''}`}
            >
              {plan.popular && (
                <div className="bg-primary text-white px-3 py-1 text-xs font-medium absolute right-0 top-0 rounded-bl-md">
                  Popular
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="flex items-baseline mt-2">
                  <span className="text-3xl font-bold">{getPrice(plan)}</span>
                  {!plan.isFree && (
                    <span className="text-gray-500 ml-1">{getPricePeriod()}</span>
                  )}
                </CardDescription>
                <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {!plan.isFree ? (
                  <Button
                    className="w-full"
                    variant={isPlanActive(plan.name) ? "outline" : "default"}
                    disabled={isPlanActive(plan.name) || subscriptionLoading}
                    onClick={() => handleUpdateSubscription(plan.id)}
                  >
                    {subscriptionLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</>
                    ) : isPlanActive(plan.name) ? (
                      'Current Plan'
                    ) : subscription?.subscribed ? (
                      'Switch Plan'
                    ) : (
                      'Select Plan'
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={isPlanActive("Free") ? "outline" : "default"}
                    disabled={isPlanActive("Free") || subscriptionLoading}
                  >
                    {isPlanActive("Free") ? 'Current Plan' : 'Free Plan'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {subscription?.subscribed && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-3">Need detailed billing information or want to update payment details?</p>
            <Button
              variant="link"
              onClick={openCustomerPortal}
              disabled={subscriptionLoading}
            >
              {subscriptionLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</>
              ) : (
                'Access Customer Portal'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingSettings;
