
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { toast } from "sonner";
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, CreditCard, Calendar } from 'lucide-react';
import { STRIPE_CONFIG } from '@/config/stripe';
import PlanSelector from '@/components/billing/PlanSelector';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const { toast: uiToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
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
      toast.success('Subscription Updated', {
        description: 'Your subscription has been updated successfully.',
      });
      checkSubscriptionStatus();
    } else if (searchParams.get('canceled') === 'true') {
      toast('Subscription update canceled');
    }
  }, [searchParams]);

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
      toast.error('Failed to fetch pricing information from Stripe.');
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
      toast.error('Failed to retrieve subscription information.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshSubscriptionData = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw new Error(error.message);
      
      setSubscription(data);
      toast.success('Subscription info refreshed');
    } catch (err) {
      console.error('Error refreshing subscription data:', err);
      toast.error('Could not refresh subscription information');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectPlan = async (planId: string, cycle: 'monthly' | 'yearly') => {
    try {
      setSubscriptionLoading(true);
      const { data, error } = await supabase.functions.invoke('update-subscription', {
        body: { newPriceId: planId, cycle }
      });
      
      if (error) throw new Error(error.message);
      
      // If we got client_secret back, the user needs to complete payment setup
      if (data?.subscription?.client_secret) {
        // For now, we'll handle by redirecting to customer portal
        // In the future, we could implement Stripe Elements to collect payment
        openCustomerPortal();
        return;
      }

      // If no client_secret, the update was successful
      if (data?.success) {
        toast.success('Subscription created successfully!');
        await checkSubscriptionStatus();
      }
    } catch (err) {
      console.error('Error creating subscription:', err);
      toast.error('Could not create subscription');
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
      toast.error('Failed to open customer portal');
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleDowngrade = () => {
    setShowDowngradeDialog(true);
  };

  const confirmDowngrade = async () => {
    try {
      setSubscriptionLoading(true);
      const { data, error } = await supabase.functions.invoke('update-subscription', {
        body: { cancel: true }
      });
      
      if (error) throw new Error(error.message);
      
      toast.success('Your subscription has been cancelled');
      await checkSubscriptionStatus();
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      toast.error('Could not cancel subscription');
    } finally {
      setSubscriptionLoading(false);
      setShowDowngradeDialog(false);
    }
  };

  const getFormattedCardInfo = () => {
    if (!subscription?.payment_method) return null;
    
    const { brand, last4, exp_month, exp_year } = subscription.payment_method;
    if (!brand || !last4) return null;
    
    return {
      name: brand.charAt(0).toUpperCase() + brand.slice(1),
      last4,
      exp: exp_month && exp_year ? `${exp_month.toString().padStart(2, '0')}/${exp_year % 100}` : null
    };
  };

  const getCurrentPlanId = () => {
    if (!subscription?.current_plan) return null;
    
    if (subscription.current_plan.includes('standard')) return 'standard';
    if (subscription.current_plan.includes('premium')) return 'premium';
    if (subscription.current_plan.includes('enterprise')) return 'enterprise';
    return null;
  };
  
  const getCurrentCycle = () => {
    if (!subscription?.current_plan) return 'monthly';
    return subscription.current_plan.includes('yearly') ? 'yearly' : 'monthly';
  };

  if (loading || pricesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const cardInfo = getFormattedCardInfo();
  const currentPlanId = getCurrentPlanId();
  const currentCycle = getCurrentCycle();
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">Select Your Plan</h2>
        <Button
          variant="ghost" 
          size="sm" 
          onClick={refreshSubscriptionData}
          disabled={refreshing}
          className="transition-all hover:bg-primary/10"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      {/* Subscription Info */}
      {subscription?.subscribed && (
        <div className="bg-muted/50 rounded-lg p-4 border border-muted-foreground/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Your subscription will auto-renew on {new Date(subscription.subscription_end || '').toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}.</p>
              
              {cardInfo && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <CreditCard className="h-3 w-3" />
                  On that date, the {cardInfo.name} card (ending in {cardInfo.last4}) will be charged.
                </p>
              )}
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={openCustomerPortal}
              disabled={subscriptionLoading}
              className="shrink-0"
            >
              Manage Payment
            </Button>
          </div>
        </div>
      )}
      
      {!subscription?.subscribed && (
        <div className="bg-muted/50 rounded-lg p-4 border border-muted-foreground/20">
          <p className="text-sm text-muted-foreground">You are a free subscriber.</p>
        </div>
      )}
      
      {/* Plans Selection Section */}
      <div className="overflow-x-auto -mx-6 md:mx-0">
        <div className="min-w-[800px] md:min-w-0 px-6 md:px-0">
          <PlanSelector
            currentPlan={currentPlanId}
            isLoading={subscriptionLoading}
            cycle={currentCycle}
            onSelect={handleSelectPlan}
            priceData={stripePrices}
            showDowngrade={Boolean(subscription?.subscribed)}
            onDowngrade={handleDowngrade}
          />
        </div>
      </div>
      
      {/* Downgrade Dialog */}
      <AlertDialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Downgrade to Free Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2">Are you sure you want to downgrade to the Free plan?</p>
              <p className="mb-4">You'll lose access to premium features immediately:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Unlimited links</li>
                <li>Custom domains</li>
                <li>Advanced analytics</li>
                {currentPlanId === 'premium' && (
                  <>
                    <li>City-level analytics</li>
                    <li>API access</li>
                    <li>Priority support</li>
                  </>
                )}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDowngrade}>
              {subscriptionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm Downgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlanSettings;
