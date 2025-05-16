
import { supabase } from '@/integrations/supabase/client';

/**
 * API functions for Stripe Customer Portal configuration
 */

/**
 * Configure Stripe Customer Portal with specific settings
 * @param appUrl Base URL of the application for return URLs
 * @param features Optional features configuration
 * @returns Configuration result with success status and configuration ID
 */
export const configureStripeCustomerPortal = async (
  appUrl: string, 
  features?: {
    invoice_history?: { enabled: boolean },
    payment_method_update?: { enabled: boolean },
    customer_update?: { 
      enabled: boolean, 
      allowed_updates?: string[] 
    },
    subscription_cancel?: { enabled: boolean },
    subscription_update?: { enabled: boolean }
  }
): Promise<{
  success?: boolean;
  message?: string;
  configId?: string;
  config?: any;
  error?: string;
}> => {
  try {
    // Log the parameters being sent
    console.log('Configuring Stripe portal with app URL:', appUrl);
    if (features) {
      console.log('Features configuration:', features);
    }
    
    const { data, error } = await supabase.functions.invoke('initialize-stripe-portal', {
      body: { 
        appUrl,
        features 
      }
    });
    
    if (error) {
      console.error('Error configuring Stripe portal:', error);
      throw new Error(error.message || 'Failed to configure customer portal');
    }
    
    // Log the response from the function
    console.log('Stripe portal configuration response:', data);
    
    return {
      success: data.success,
      message: data.message,
      configId: data.configId,
      config: data.config
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
 * Get the current Stripe Customer Portal configuration
 * @returns The portal configuration if it exists
 */
export const getStripePortalConfig = async (): Promise<{
  success?: boolean;
  configExists?: boolean;
  config?: any;
  error?: string;
}> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-portal-config');
    
    if (error) {
      console.error('Error fetching Stripe portal configuration:', error);
      throw new Error(error.message || 'Failed to fetch portal configuration');
    }
    
    return {
      success: data.success,
      configExists: data.configExists,
      config: data.config
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error fetching Stripe portal configuration:', errorMessage);
    
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
