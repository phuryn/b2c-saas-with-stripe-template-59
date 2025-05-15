
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { 
  updateSubscription, 
  openCustomerPortalApi, 
  createCheckoutSession 
} from '@/api/subscriptionApi';

/**
 * Hook for subscription-related actions
 */
export function useSubscriptionActions() {
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  
  /**
   * Handle plan selection or change
   */
  const handleSelectPlan = async (planId: string, cycle: 'monthly' | 'yearly') => {
    try {
      setSubscriptionLoading(true);
      
      // If there's no active subscription, use create-checkout to redirect to Stripe
      if (!localStorage.getItem('hasActiveSubscription')) {
        const data = await createCheckoutSession(planId);
        
        if (data?.url) {
          // Redirect to Stripe Checkout
          window.location.href = data.url;
          return;
        }
        
        throw new Error('Failed to create checkout session');
      }
      
      // For existing subscriptions, use update-subscription as before
      const data = await updateSubscription(planId, cycle);
      
      // If we got client_secret back, the user needs to complete payment setup
      if (data?.subscription?.client_secret) {
        // For now, we'll handle by redirecting to customer portal
        await openCustomerPortal();
        return;
      }

      // If no client_secret, the update was successful
      if (data?.success) {
        // Return the cycle along with success status for UI updates
        console.log('Subscription updated successfully with cycle:', cycle);
        return { success: true, cycle };
      }
      
      return { success: false };
    } catch (err) {
      console.error('Error updating subscription:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not update subscription';
      toast.error(errorMessage);
      return { success: false };
    } finally {
      setSubscriptionLoading(false);
    }
  };

  /**
   * Open customer portal
   */
  const openCustomerPortal = async () => {
    try {
      setSubscriptionLoading(true);
      const data = await openCustomerPortalApi();
      
      if (data?.url) {
        window.location.href = data.url;
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error opening customer portal:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to open customer portal';
      toast.error(errorMessage);
      return false;
    } finally {
      setSubscriptionLoading(false);
    }
  };

  /**
   * Handle subscription downgrade
   */
  const handleDowngrade = async () => {
    try {
      setSubscriptionLoading(true);
      const data = await updateSubscription(undefined, undefined, { cancel: true });
      
      if (data?.success) {
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not cancel subscription';
      toast.error(errorMessage);
      return false;
    } finally {
      setSubscriptionLoading(false);
    }
  };

  /**
   * Handle subscription renewal
   */
  const handleRenewSubscription = async () => {
    try {
      setSubscriptionLoading(true);
      const data = await updateSubscription(undefined, undefined, { renew: true });
      
      if (data?.success) {
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error renewing subscription:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not renew subscription';
      toast.error(errorMessage);
      return false;
    } finally {
      setSubscriptionLoading(false);
    }
  };

  return {
    subscriptionLoading,
    handleSelectPlan,
    openCustomerPortal,
    handleDowngrade,
    handleRenewSubscription
  };
}
