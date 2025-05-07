
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Subscription } from '@/types/subscription';

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const checkSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        throw new Error(error.message);
      }
      
      setSubscription(data);
      return data;
    } catch (err) {
      console.error('Error checking subscription status:', err);
      toast.error('Failed to retrieve subscription information.');
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshSubscriptionData = async () => {
    if (refreshing) return;
    
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

  return {
    subscription,
    loading,
    refreshing,
    subscriptionLoading,
    checkSubscriptionStatus,
    refreshSubscriptionData,
    handleSelectPlan,
    openCustomerPortal,
    handleDowngrade
  };
}
