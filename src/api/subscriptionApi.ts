
import { supabase } from '@/integrations/supabase/client';
import { Subscription } from '@/types/subscription';

/**
 * API functions for subscription-related operations
 */

/**
 * Fetch subscription status from Supabase
 */
export const fetchSubscriptionStatus = async (): Promise<Subscription | null> => {
  const { data, error } = await supabase.functions.invoke('check-subscription');
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

/**
 * Create checkout session for new subscription
 */
export const createCheckoutSession = async (planId: string): Promise<{ url: string } | null> => {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { priceId: planId }
  });
  
  if (error) throw new Error(error.message);
  
  return data;
};

/**
 * Update existing subscription
 */
export const updateSubscription = async (
  newPriceId?: string, 
  cycle?: 'monthly' | 'yearly',
  options?: { cancel?: boolean; renew?: boolean }
): Promise<{ success?: boolean; subscription?: { client_secret?: string } } | null> => {
  const { data, error } = await supabase.functions.invoke('update-subscription', {
    body: { 
      newPriceId, 
      cycle,
      ...options
    }
  });
  
  if (error) throw new Error(error.message);
  
  return data;
};

/**
 * Open customer portal
 */
export const openCustomerPortalApi = async (): Promise<{ url: string } | null> => {
  const { data, error } = await supabase.functions.invoke('customer-portal');
  
  if (error) throw new Error(error.message);
  
  return data;
};
