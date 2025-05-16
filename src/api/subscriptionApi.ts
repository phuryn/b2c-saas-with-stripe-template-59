
import { supabase } from '@/integrations/supabase/client';
import { Subscription } from '@/types/subscription';

/**
 * API functions for subscription-related operations
 */

/**
 * Fetch subscription status from Supabase
 */
export const fetchSubscriptionStatus = async (): Promise<Subscription | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('check-subscription');
    
    if (error) {
      // If error includes a rate limit message, throw a more specific error
      if (error.message && error.message.toLowerCase().includes('rate limit')) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.');
      }
      throw new Error(error.message || 'Failed to check subscription status');
    }
    
    return data;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Rate limit exceeded')) {
      console.warn('Rate limit exceeded when checking subscription, using cached data');
      // In case of rate limiting, don't throw - return null and let the hook use cached data
      return null;
    }
    throw err;
  }
};

/**
 * Create checkout session for new subscription
 */
export const createCheckoutSession = async (planId: string): Promise<{ url: string } | null> => {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { priceId: planId }
  });
  
  if (error) throw new Error(error.message || 'Failed to create checkout session');
  
  return data;
};

/**
 * Update existing subscription
 */
export const updateSubscription = async (
  newPriceId?: string, 
  cycle?: 'monthly' | 'yearly',
  options?: { cancel?: boolean; renew?: boolean }
): Promise<{ 
  success?: boolean; 
  subscription?: { client_secret?: string };
  redirect_to_checkout?: boolean;
  cycle?: 'monthly' | 'yearly';
} | null> => {
  const { data, error } = await supabase.functions.invoke('update-subscription', {
    body: { 
      newPriceId, 
      cycle,
      ...options
    }
  });
  
  if (error) {
    console.error('Error updating subscription:', error);
    throw new Error(error.message || 'Could not update subscription');
  }
  
  if (!data) {
    throw new Error('No data received from update-subscription endpoint');
  }
  
  // After subscription update, clear the check timestamp to force a fresh check
  try {
    localStorage.removeItem('last_subscription_check');
  } catch (e) {
    console.warn('Could not clear subscription check timestamp:', e);
  }
  
  return data;
};

/**
 * Open customer portal
 */
export const openCustomerPortalApi = async (flow?: string): Promise<{ url: string } | null> => {
  const { data, error } = await supabase.functions.invoke('customer-portal', {
    body: { flow }
  });
  
  if (error) throw new Error(error.message || 'Failed to open customer portal');
  
  return data;
};

/**
 * Configure Stripe products and prices
 */
export const configureStripeProducts = async (stripeSecretKey?: string): Promise<{
  success: boolean;
  priceIds: Record<string, string>;
}> => {
  const { data, error } = await supabase.functions.invoke('configure-stripe-products', {
    body: { stripeSecretKey }
  });
  
  if (error) throw new Error(error.message || 'Failed to configure Stripe products');
  
  return data;
};

/**
 * Configure Stripe customer portal
 */
export const configureStripePortal = async (stripeSecretKey?: string): Promise<{
  success: boolean;
  configId: string;
}> => {
  const { data, error } = await supabase.functions.invoke('configure-stripe-portal', {
    body: { stripeSecretKey }
  });
  
  if (error) throw new Error(error.message || 'Failed to configure Stripe customer portal');
  
  return data;
};

/**
 * Check if secrets are ready
 */
export const checkSecretsReady = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.functions.invoke('configure-stripe-products', {
      body: { checkSecretOnly: true }
    });
    
    return data?.secretsReady || false;
  } catch (err) {
    console.error('Error checking secrets readiness:', err);
    return false;
  }
};
