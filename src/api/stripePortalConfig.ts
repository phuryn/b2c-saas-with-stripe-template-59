
import { supabase } from '@/integrations/supabase/client';

/**
 * API functions for Stripe Customer Portal configuration
 */

/**
 * Configure Stripe Customer Portal with specific settings
 * @param appUrl Base URL of the application for return URLs
 * @returns Configuration result with success status and configuration ID
 */
export const configureStripeCustomerPortal = async (appUrl: string): Promise<{
  success?: boolean;
  message?: string;
  configId?: string;
  error?: string;
}> => {
  try {
    const { data, error } = await supabase.functions.invoke('initialize-stripe-portal', {
      body: { appUrl }
    });
    
    if (error) {
      console.error('Error configuring Stripe portal:', error);
      throw new Error(error.message || 'Failed to configure customer portal');
    }
    
    return {
      success: data.success,
      message: data.message,
      configId: data.configId
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error configuring Stripe portal:', errorMessage);
    
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
    const { data, error } = await supabase.functions.invoke('initialize-stripe-portal', {
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
