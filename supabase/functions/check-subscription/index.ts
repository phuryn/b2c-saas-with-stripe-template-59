
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import { verifyAuth } from "./auth.ts";
import { getSubscriptionData } from "./subscription.ts";
import { updateDatabase } from "./database.ts";
import { logStep } from "./logger.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Extract and verify authentication token
    const user = await verifyAuth(req);
    
    // Get subscription data from Stripe
    const subscriptionData = await getSubscriptionData(user);
    
    // Update database with latest subscription info
    await updateDatabase(user, subscriptionData);
    
    logStep("Completed successfully");
    
    return new Response(JSON.stringify(subscriptionData), {
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
