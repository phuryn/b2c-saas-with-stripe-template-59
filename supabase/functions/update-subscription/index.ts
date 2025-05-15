import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, logStep } from "./utils.ts";
import { getStripeCustomer, getActiveSubscription, createNewSubscription } from "./customer.ts";
import { 
  cancelSubscription, 
  renewSubscription, 
  updateSubscriptionPrice, 
  checkIfPriceChanged,
  scheduleSubscriptionUpdate,
  scheduleCycleChange,
  cancelPendingChanges,
  hasPendingChanges
} from "./subscription.ts";

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
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Handle cancellation case
    if (requestBody.cancel === true) {
      logStep("Processing cancellation request");
      const customerId = await getStripeCustomer(stripe, user.email);
      const subscription = await getActiveSubscription(stripe, customerId);
      
      if (!subscription) {
        throw new Error("No active subscription found to cancel");
      }
      
      const result = await cancelSubscription(stripe, subscription.id);
      
      return new Response(JSON.stringify({ 
        success: true, 
        subscription: result
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // Handle subscription renewal
    if (requestBody.renew === true) {
      logStep("Processing renewal request");
      const customerId = await getStripeCustomer(stripe, user.email);
      const subscription = await getActiveSubscription(stripe, customerId);
      
      if (!subscription) {
        throw new Error("No active subscription found to renew");
      }
      
      const result = await renewSubscription(stripe, subscription.id);
      
      return new Response(JSON.stringify({ 
        success: true, 
        subscription: result
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // Handle cancellation of pending changes
    if (requestBody.cancelPendingChanges === true) {
      logStep("Processing request to cancel pending changes");
      const customerId = await getStripeCustomer(stripe, user.email);
      const subscription = await getActiveSubscription(stripe, customerId);
      
      if (!subscription) {
        throw new Error("No active subscription found");
      }
      
      const result = await cancelPendingChanges(stripe, subscription.id);
      
      return new Response(JSON.stringify({ 
        success: true, 
        subscription: result
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // Handle plan update case
    const { newPriceId, cycle, scheduleForEndOfCycle } = requestBody;
    if (!newPriceId) throw new Error("New price ID is required");
    logStep("Request data parsed", { newPriceId, cycle, scheduleForEndOfCycle });
    
    const customerId = await getStripeCustomer(stripe, user.email);
    const subscription = await getActiveSubscription(stripe, customerId);

    if (!subscription) {
      const result = await createNewSubscription(stripe, customerId, newPriceId);
      
      return new Response(JSON.stringify({ 
        success: true, 
        subscription: result
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // If there are pending changes, don't allow new changes until they're cancelled
    if (hasPendingChanges(subscription)) {
      logStep("Cannot make new changes while pending changes exist");
      return new Response(JSON.stringify({ 
        success: false,
        error: "Cannot make new changes while pending changes exist. Please cancel pending changes first."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if the new price is the same as the current one
    if (!checkIfPriceChanged(subscription, newPriceId)) {
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

    // Get subscription item ID
    const subscriptionItemId = subscription.items.data[0].id;
    let result;
    
    // If it's a downgrade or the user specifically requests to schedule for end of cycle
    // Schedule the change for the end of the billing cycle
    const currentPriceId = subscription.items.data[0].price.id;
    const currentPrice = await stripe.prices.retrieve(currentPriceId);
    const newPrice = await stripe.prices.retrieve(newPriceId);
    
    // Check if this is a cycle change (monthly to yearly or vice versa)
    const isCycleChange = 
      currentPrice.recurring?.interval !== newPrice.recurring?.interval;
    
    // Check if it's a downgrade (premium to standard)
    const isDowngrade = 
      (currentPriceId.includes('premium') && newPriceId.includes('standard')) ||
      (currentPrice.unit_amount || 0) > (newPrice.unit_amount || 0);
    
    // For cycle changes, downgrades, or when explicitly requested, schedule for end of cycle
    if (scheduleForEndOfCycle || isDowngrade || isCycleChange) {
      if (isCycleChange) {
        // Handle billing cycle change
        result = await scheduleCycleChange(
          stripe, 
          subscription.id, 
          subscriptionItemId, 
          newPriceId
        );
      } else {
        // Handle plan change or downgrade
        result = await scheduleSubscriptionUpdate(
          stripe, 
          subscription.id, 
          subscriptionItemId, 
          newPriceId
        );
      }
    } else {
      // Otherwise, perform immediate change with prorations
      result = await updateSubscriptionPrice(
        stripe, 
        subscription.id, 
        subscriptionItemId, 
        newPriceId
      );
    }

    return new Response(JSON.stringify({ 
      success: true, 
      subscription: result
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
