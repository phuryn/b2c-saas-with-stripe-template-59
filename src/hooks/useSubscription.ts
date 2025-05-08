
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Subscription } from '@/types/subscription';

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [errorState, setErrorState] = useState(false);
  
  // Tracking for rate limiting
  const lastAttemptRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000; // 5 seconds between retries

  const checkSubscriptionStatus = async () => {
    // Rate limiting protection
    const now = Date.now();
    if (errorState && now - lastAttemptRef.current < RETRY_DELAY) {
      console.log('Skipping subscription check due to recent error');
      return null;
    }

    try {
      setLoading(true);
      lastAttemptRef.current = now;
      
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Reset error state and retry count on success
      setErrorState(false);
      retryCountRef.current = 0;
      setSubscription(data);
      return data;
    } catch (err) {
      retryCountRef.current++;
      console.error('Error checking subscription status:', err);
      
      // Only show error toast on initial errors, not on every retry
      if (!errorState) {
        toast.error('Failed to retrieve subscription information.');
        setErrorState(true);
      }
      
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshSubscriptionData = async () => {
    if (refreshing) return;
    
    // Reset error state when manually refreshing
    setErrorState(false);
    setRefreshing(true);
    
    try {
      const data = await checkSubscriptionStatus();
      if (data) {
        toast.success('Subscription info refreshed');
      }
    } catch (err) {
      console.error('Error refreshing subscription data:', err);
      toast.error('Could not refresh subscription information');
    } finally {
      setRefreshing(false);
    }
  };

  // Update AppLayout to use this hook correctly
  const handleSelectPlan = async (planId: string, cycle: 'monthly' | 'yearly') => {
    try {
      setSubscriptionLoading(true);
      
      // If there's no active subscription, use create-checkout to redirect to Stripe
      if (!subscription?.subscribed) {
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: { priceId: planId }
        });
        
        if (error) throw new Error(error.message);
        
        if (data?.url) {
          // Redirect to Stripe Checkout
          window.location.href = data.url;
          return;
        }
        
        throw new Error('Failed to create checkout session');
      }
      
      // For existing subscriptions, use update-subscription as before
      const { data, error } = await supabase.functions.invoke('update-subscription', {
        body: { newPriceId: planId, cycle }
      });
      
      if (error) throw new Error(error.message);
      
      // If we got client_secret back, the user needs to complete payment setup
      if (data?.subscription?.client_secret) {
        // For now, we'll handle by redirecting to customer portal
        openCustomerPortal();
        return;
      }

      // If no client_secret, the update was successful
      if (data?.success) {
        toast.success('Subscription updated successfully!');
        await checkSubscriptionStatus();
      }
    } catch (err) {
      console.error('Error updating subscription:', err);
      toast.error('Could not update subscription');
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

  const handleDowngrade = async () => {
    try {
      setSubscriptionLoading(true);
      const { data, error } = await supabase.functions.invoke('update-subscription', {
        body: { cancel: true }
      });
      
      if (error) throw new Error(error.message);
      
      toast.success('Your subscription has been cancelled');
      await checkSubscriptionStatus();
      return true;
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      toast.error('Could not cancel subscription');
      return false;
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleRenewSubscription = async () => {
    try {
      setSubscriptionLoading(true);
      const { data, error } = await supabase.functions.invoke('update-subscription', {
        body: { renew: true }
      });
      
      if (error) throw new Error(error.message);
      
      if (data?.success) {
        toast.success('Your subscription has been renewed');
        await checkSubscriptionStatus();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error renewing subscription:', err);
      toast.error('Could not renew subscription');
      return false;
    } finally {
      setSubscriptionLoading(false);
    }
  };

  return {
    subscription,
    loading,
    refreshing,
    subscriptionLoading,
    checkSubscriptionStatus,
    refreshSubscriptionData,
    handleSelectPlan,
    openCustomerPortal,
    handleDowngrade,
    handleRenewSubscription
  };
}
