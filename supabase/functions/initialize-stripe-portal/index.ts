
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
  console.log(`[INITIALIZE-STRIPE-PORTAL] ${step}${detailsStr}`);
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
    const appUrl = requestData.appUrl || "https://app.example.com";
    
    // Get Stripe secret key from environment variable
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    logStep("Request data", { appUrl });
    
    // Check if this is just a check for if the secrets are ready
    if (requestData.checkSecretOnly) {
      const secretsReady = !!stripeSecretKey;
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
    
    // Initialize Stripe client with the secret key from env
    if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is not set in Supabase Functions secrets");
    
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    logStep("Stripe initialized");
    
    // Configure the Stripe customer portal
    const portalConfiguration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: "Manage your subscription",
        privacy_policy_url: `${appUrl}/privacy_policy`,
        terms_of_service_url: `${appUrl}/terms`,
      },
      features: {
        invoice_history: { enabled: false },
        payment_method_update: { enabled: true },
        customer_update: {
          enabled: true,
          allowed_updates: ['email', 'address', 'tax_id'],
        },
        subscription_cancel: { enabled: false },
        subscription_update: { enabled: false },
      },
    });
    
    logStep("Customer portal configured", { configId: portalConfiguration.id });
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Customer portal configured successfully",
      configId: portalConfiguration.id
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
