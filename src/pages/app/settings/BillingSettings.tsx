
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams } from 'react-router-dom';

interface PlanOption {
  id: string;
  name: string;
  price: string;
  priceId: string;
  description: string;
  features: string[];
  popular?: boolean;
}

const BillingSettings: React.FC = () => {
  const { user, session } = useAuth();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscription, setSubscription] = useState<{
    subscribed: boolean;
    subscription_tier: string | null;
    subscription_end: string | null;
    current_plan: string | null;
  } | null>(null);
  
  const plans: PlanOption[] = [
    {
      id: "starter",
      name: "Starter",
      price: "$29",
      priceId: "price_starter", // Replace with actual Stripe price ID
      description: "Perfect for small teams getting started.",
      features: ["Up to 5 team members", "10 projects", "5GB storage", "Basic support"],
    },
    {
      id: "pro",
      name: "Pro",
      price: "$79",
      priceId: "price_pro", // Replace with actual Stripe price ID
      description: "For growing teams with advanced needs.",
      features: ["Up to 20 team members", "Unlimited projects", "25GB storage", "Priority support", "Advanced analytics"],
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "$199",
      priceId: "price_enterprise", // Replace with actual Stripe price ID
      description: "For large organizations and complex needs.",
      features: [
        "Unlimited team members", 
        "Unlimited projects", 
        "100GB storage", 
        "24/7 dedicated support", 
        "Custom integrations", 
        "SLA guarantees"
      ],
    },
  ];

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

  const handleSubscribe = async (priceId: string) => {
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

  const handleUpdateSubscription = async (priceId: string) => {
    if (!subscription?.subscribed) {
      return handleSubscribe(priceId);
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
    if (!subscription?.subscribed) return false;
    return subscription.subscription_tier === planName;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-medium mb-4">Billing and Usage</h2>
      
      {subscription?.subscribed && (
        <div className="mb-6">
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
          >
            {subscriptionLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</>
            ) : (
              'Manage Subscription'
            )}
          </Button>
        </div>
      )}

      <h3 className="text-lg font-medium mb-4">Available Plans</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`overflow-hidden ${isPlanActive(plan.name) ? 'border-primary-blue border-2' : ''}`}
          >
            {plan.popular && (
              <div className="bg-primary-blue text-white px-3 py-1 text-sm font-medium absolute right-0 top-0">
                Popular
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription className="flex items-baseline">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-gray-500 ml-1">/month</span>
              </CardDescription>
              <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={isPlanActive(plan.name) ? "outline" : "default"}
                disabled={isPlanActive(plan.name) || subscriptionLoading}
                onClick={() => handleUpdateSubscription(plan.priceId)}
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
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BillingSettings;
