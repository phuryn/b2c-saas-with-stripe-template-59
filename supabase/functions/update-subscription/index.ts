
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPDATE-SUBSCRIPTION] ${step}${detailsStr}`);
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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const requestBody = await req.json();
    logStep("Request data parsed", requestBody);
    
    // Handle cancellation case
    if (requestBody.cancel === true) {
      logStep("Processing cancellation request");
      const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
      
      // Get customer
      logStep("Searching for customer");
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length === 0) {
        throw new Error("No Stripe customer found for this user");
      }
      const customerId = customers.data[0].id;
      logStep("Customer found", { customerId });

      // Get current subscription
      logStep("Searching for active subscription");
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        throw new Error("No active subscription found to cancel");
      }

      const subscriptionId = subscriptions.data[0].id;
      logStep("Active subscription found", { subscriptionId });
      
      // Cancel subscription at period end
      const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      
      logStep("Subscription scheduled for cancellation at period end", {
        subscriptionId,
        cancel_at_period_end: canceledSubscription.cancel_at_period_end,
        current_period_end: new Date(canceledSubscription.current_period_end * 1000)
      });
      
      return new Response(JSON.stringify({ 
        success: true, 
        subscription: {
          id: canceledSubscription.id,
          current_period_end: new Date(canceledSubscription.current_period_end * 1000),
          cancel_at_period_end: canceledSubscription.cancel_at_period_end,
          action: "canceled_subscription"
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    const { newPriceId } = requestBody;
    if (!newPriceId) throw new Error("New price ID is required");
    logStep("Request data parsed", { newPriceId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Get customer
    logStep("Searching for customer");
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found for this user");
    }
    const customerId = customers.data[0].id;
    logStep("Customer found", { customerId });

    // Get current subscription
    logStep("Searching for active subscription");
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription, creating new subscription");
      // Create a new subscription for the customer
      const newSubscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: newPriceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      });

      const invoice = newSubscription.latest_invoice;
      let clientSecret = null;

      if (typeof invoice !== 'string' && 
          invoice?.payment_intent && 
          typeof invoice.payment_intent !== 'string') {
        clientSecret = invoice.payment_intent.client_secret;
      }

      return new Response(JSON.stringify({ 
        success: true, 
        subscription: {
          id: newSubscription.id,
          status: newSubscription.status,
          client_secret: clientSecret,
          action: "new_subscription"
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = subscriptions.data[0];
    const subscriptionId = subscription.id;
    const subscriptionItemId = subscription.items.data[0].id;
    logStep("Active subscription found", { subscriptionId, currentPrice: subscription.items.data[0].price.id });

    // Check if the new price is the same as the current one
    if (subscription.items.data[0].price.id === newPriceId) {
      logStep("No change needed, new price is the same as current price");
      return new Response(JSON.stringify({ 
        success: true, 
        subscription: {
          id: subscription.id,
          current_period_end: new Date(subscription.current_period_end * 1000),
          plan: subscription.items.data[0].price.id,
          action: "no_change"
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Update subscription with new price
    logStep("Updating subscription with new price", { newPriceId });
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscriptionItemId,
        price: newPriceId,
      }],
      proration_behavior: "create_prorations",
    });
    logStep("Subscription updated successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      subscription: {
        id: updatedSubscription.id,
        current_period_end: new Date(updatedSubscription.current_period_end * 1000),
        plan: updatedSubscription.items.data[0].price.id,
        action: "updated_subscription"
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
