
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONFIGURE-STRIPE-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    logStep("Function started");
    
    // Parse request data
    const requestData = await req.json();
    
    // Get Stripe secret key from request or from environment variable
    let stripeSecretKey = requestData.stripeSecretKey || Deno.env.get("STRIPE_SECRET_KEY");
    
    logStep("Request data parsed");
    
    // Check if this is just a check for if the secrets are ready
    if (requestData.checkSecretOnly) {
      const secretsReady = !!Deno.env.get("STRIPE_SECRET_KEY");
      logStep("Checking secrets only", { secretsReady });
      return new Response(JSON.stringify({ secretsReady }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // Authenticate user and verify admin role
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
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });
    
    // Verify user has administrator role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    const { data: roleData, error: roleError } = await adminClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (roleError) throw new Error(`Failed to verify role: ${roleError.message}`);
    if (roleData?.role !== "administrator") throw new Error("Only administrators can perform this action");
    logStep("User is administrator");
    
    // If a Stripe secret key was provided in the request, store it as a secret
    if (requestData.stripeSecretKey) {
      try {
        // Store the secret using the Supabase Functions API
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (!supabaseUrl || !serviceRoleKey) {
          throw new Error("Missing Supabase URL or service role key");
        }
        
        const secretsUrl = `${supabaseUrl}/functions/v1/secrets`;
        const response = await fetch(secretsUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            secrets: {
              "STRIPE_SECRET_KEY": requestData.stripeSecretKey
            }
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to store Stripe secret key: ${await response.text()}`);
        }
        
        logStep("Stored Stripe secret key successfully");
        
        // Use the provided key for the rest of the function
        stripeSecretKey = requestData.stripeSecretKey;
      } catch (secretError) {
        logStep("ERROR storing secret", { message: secretError instanceof Error ? secretError.message : String(secretError) });
        // Continue with the provided key even if storing failed
      }
    }
    
    // Initialize Stripe client with the secret key from env or request
    if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    logStep("Stripe initialized");
    
    // Configure the Stripe customer portal
    // First check if there's already a configuration
    const configs = await stripe.billingPortal.configurations.list({ limit: 1 });
    let configId;
    
    // Determine configuration properties
    const configProps = {
      business_profile: {
        headline: "Manage your subscription",
      },
      features: {
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        customer_update: {
          enabled: true,
          allowed_updates: ['name', 'address', 'tax_id'],
        },
        subscription_cancel: { enabled: true },
        subscription_update: { enabled: true },
      },
    };
    
    // Update or create configuration
    if (configs.data.length > 0) {
      // Update existing config
      configId = configs.data[0].id;
      logStep("Updating existing portal configuration", { configId });
      await stripe.billingPortal.configurations.update(configId, configProps);
    } else {
      // Create new config
      logStep("Creating new portal configuration");
      const newConfig = await stripe.billingPortal.configurations.create(configProps);
      configId = newConfig.id;
    }
    
    logStep("Customer portal configured", { configId });
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Customer portal configured successfully",
      configId
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
