
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, logStep } from "./utils.ts";
import { getStripeCustomer, getActiveSubscription, createNewSubscription } from "./customer.ts";
import { 
  cancelSubscription, 
  renewSubscription, 
  updateSubscriptionPrice, 
  checkIfPriceChanged 
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
    
    // Handle price update case
    const { newPriceId, cycle } = requestBody;
    if (!newPriceId) throw new Error("New price ID is required");
    logStep("Request data parsed", { newPriceId, cycle });
    
    try {
      // First attempt to get the customer (if they exist)
      const customerId = await getStripeCustomer(stripe, user.email);
      logStep("Customer found or created", { customerId });
      
      // Check if they have an active subscription
      const subscription = await getActiveSubscription(stripe, customerId);
      
      if (!subscription) {
        logStep("No active subscription, redirecting to checkout", { customerId, priceId: newPriceId });
        // Free user upgrading - create a checkout session instead
        return new Response(JSON.stringify({ 
          redirect_to_checkout: true,
          message: "User should be redirected to checkout"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      // If they have an active subscription, proceed with the update
      logStep("Active subscription found, updating", { subscriptionId: subscription.id });
      
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
      
      // Update subscription with new price
      const subscriptionItemId = subscription.items.data[0].id;
      const result = await updateSubscriptionPrice(
        stripe, 
        subscription.id, 
        subscriptionItemId, 
        newPriceId
      );
      
      return new Response(JSON.stringify({ 
        success: true, 
        subscription: result
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (error) {
      logStep("Error in subscription handling", { error: error.message });
      throw error; // Re-throw to be caught by outer try/catch
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
