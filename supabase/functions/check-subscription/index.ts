
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration is missing");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Find the Stripe customer for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      // No customer record found, return unsubscribed state
      return new Response(JSON.stringify({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        current_plan: null,
        billing_address: null,
        payment_method: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });
    
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

      // Determine the subscription tier based on the price ID
      if (currentPlan.includes('standard')) {
        subscriptionTier = 'Standard';
      } else if (currentPlan.includes('premium')) {
        subscriptionTier = 'Premium';
      } else {
        subscriptionTier = 'Standard'; // Default
      }
      logStep("Determined subscription tier", { currentPlan, subscriptionTier });
    }

    // Update the database record with the latest subscription info
    await supabase.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });
    
    logStep("Updated database with subscription info", { 
      subscribed: hasActiveSub, 
      subscriptionTier
    });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      current_plan: currentPlan,
      cancel_at_period_end: cancelAtPeriodEnd,
      payment_method: paymentMethod,
      billing_address: billingAddress
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      subscribed: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
