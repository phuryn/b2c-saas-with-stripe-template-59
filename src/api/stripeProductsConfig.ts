
import { supabase } from '@/integrations/supabase/client';

/**
 * API functions for Stripe Products and Prices configuration
 */

/**
 * Initialize Stripe products and prices based on the application's plan configuration
 * @returns Configuration result with success status and price IDs
 */
export const initializeStripeProducts = async (): Promise<{
  success?: boolean;
  message?: string;
  priceIds?: Record<string, string>;
  error?: string;
}> => {
  try {
    const { data, error } = await supabase.functions.invoke('initialize-stripe-products', {
      body: {}
    });
    
    if (error) {
      console.error('Error initializing Stripe products:', error);
      throw new Error(error.message || 'Failed to initialize products');
    }
    
    return {
      success: data.success,
      message: data.message,
      priceIds: data.priceIds
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error initializing Stripe products:', errorMessage);
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Check if Stripe secret key is configured
 * @returns Boolean indicating if secret key is set
 */
export const checkStripeSecretConfigured = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('initialize-stripe-products', {
      body: { checkSecretOnly: true }
    });
    
    if (error) {
      console.error('Error checking Stripe secret configuration:', error);
      return false;
    }
    
    return data?.secretsReady || false;
  } catch (err) {
    console.error('Error checking Stripe configuration:', err);
    return false;
  }
};
