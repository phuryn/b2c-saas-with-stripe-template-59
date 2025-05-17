import Stripe from "https://esm.sh/stripe@14.21.0";
import { logStep } from "./logger.ts";
import type { User } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getStripeClient, STRIPE_CONFIG } from "./stripe.ts";

type SubscriptionData = {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  current_plan: string | null;
  cancel_at_period_end: boolean;
  payment_method: {
    brand?: string;
    last4?: string;
    exp_month?: number;
    exp_year?: number;
  } | null;
  billing_address: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    name?: string;
    tax_id?: string;
  } | null;
};

/**
 * Gets customer and subscription data from Stripe
 */
export const getSubscriptionData = async (user: User): Promise<SubscriptionData> => {
  const stripe = await getStripeClient();
  
  // Default return for non-subscribed users
  const emptySubscriptionData: SubscriptionData = {
    subscribed: false,
    subscription_tier: null,
    subscription_end: null,
    current_plan: null,
    cancel_at_period_end: false,
    payment_method: null,
    billing_address: null
  };
  
  // Find the Stripe customer for this user
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  if (customers.data.length === 0) {
    // No customer record found, return unsubscribed state
    return emptySubscriptionData;
  }

  const customerId = customers.data[0].id;
  logStep("Found Stripe customer", { customerId });
  
  // Get customer details, payment methods and subscription data
  const [paymentData, customerData, subscriptionData] = await Promise.all([
    getPaymentMethod(stripe, customerId),
    getCustomerDetails(stripe, customerId),
    getActiveSubscription(stripe, customerId)
  ]);
  
  // Merge all data into subscription object
  return {
    ...emptySubscriptionData,
    ...subscriptionData,
    payment_method: paymentData,
    billing_address: customerData.billingAddress
  };
};

/**
 * Gets payment method data from Stripe
 */
async function getPaymentMethod(stripe: Stripe, customerId: string) {
  // Get payment methods associated with this customer
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
    limit: 1
  });

  let paymentMethod = null;
  if (paymentMethods.data.length > 0) {
    const pm = paymentMethods.data[0];
    paymentMethod = {
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      exp_month: pm.card?.exp_month,
      exp_year: pm.card?.exp_year
    };
    logStep("Found payment method", { brand: paymentMethod.brand, last4: paymentMethod.last4 });
  }
  
  return paymentMethod;
}

/**
 * Gets customer details from Stripe
 */
async function getCustomerDetails(stripe: Stripe, customerId: string) {
  // Get customer details to access billing address and tax ID
  const customer = await stripe.customers.retrieve(customerId, { expand: ['tax_ids'] });
  let billingAddress = null;
  let taxId = null;
  let customerName = null;
  
  if (typeof customer !== 'string') {
    // Get customer name
    customerName = customer.name || null;
    logStep("Customer name", { name: customerName });
    
    // Process billing address
    billingAddress = customer.address ? {
      line1: customer.address.line1 || null,
      line2: customer.address.line2 || null,
      city: customer.address.city || null,
      state: customer.address.state || null,
      postal_code: customer.address.postal_code || null,
      country: customer.address.country || null,
      name: customerName // Add the customer name to billing address
    } : null;
    
    // Get Tax ID if available
    if (customer.tax_ids && customer.tax_ids.data && customer.tax_ids.data.length > 0) {
      taxId = customer.tax_ids.data[0].value;
      logStep("Found tax ID", { taxId });
    } else {
      // Try to get tax ID directly from the customer metadata or tax info
      taxId = customer.tax_id || null;
      if (taxId) {
        logStep("Found tax ID from customer object", { taxId });
      }
    }
    
    // Add tax ID to billing address if we found it
    if (billingAddress && taxId) {
      billingAddress.tax_id = taxId;
    }
    
    if (billingAddress) {
      logStep("Found billing address", { 
        name: customerName,
        city: billingAddress.city, 
        country: billingAddress.country,
        tax_id: taxId || 'none'
      });
    }
  }
  
  return { billingAddress };
}

/**
 * Gets active subscription data from Stripe
 */
async function getActiveSubscription(stripe: Stripe, customerId: string) {
  // Get active subscriptions
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
    expand: ['data.default_payment_method']
  });

  const hasActiveSub = subscriptions.data.length > 0;
  let subscriptionTier = null;
  let subscriptionEnd = null;
  let currentPlan = null;
  let cancelAtPeriodEnd = false;

  if (hasActiveSub) {
    const subscription = subscriptions.data[0];
    currentPlan = subscription.items.data[0].price.id;
    subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    cancelAtPeriodEnd = subscription.cancel_at_period_end;
    
    logStep("Active subscription found", { 
      subscriptionId: subscription.id, 
      endDate: subscriptionEnd,
      currentPlan,
      cancelAtPeriodEnd
    });

    // Use STRIPE_CONFIG to determine subscription tier based on price ID
    const standardPriceIds = [
      STRIPE_CONFIG.prices.standard.monthly,
      STRIPE_CONFIG.prices.standard.yearly
    ];
    
    const premiumPriceIds = [
      STRIPE_CONFIG.prices.premium.monthly,
      STRIPE_CONFIG.prices.premium.yearly
    ];
    
    if (standardPriceIds.includes(currentPlan)) {
      subscriptionTier = STRIPE_CONFIG.prices.standard.displayName;
      logStep("Determined subscription tier", { currentPlan, subscriptionTier });
    } else if (premiumPriceIds.includes(currentPlan)) {
      subscriptionTier = STRIPE_CONFIG.prices.premium.displayName;
      logStep("Determined subscription tier", { currentPlan, subscriptionTier });
    } else {
      subscriptionTier = 'Standard'; // Default
      logStep("Using default subscription tier", { currentPlan, subscriptionTier });
    }
  }
  
  return {
    subscribed: hasActiveSub,
    subscription_tier: subscriptionTier,
    subscription_end: subscriptionEnd,
    current_plan: currentPlan,
    cancel_at_period_end: cancelAtPeriodEnd,
  };
}
