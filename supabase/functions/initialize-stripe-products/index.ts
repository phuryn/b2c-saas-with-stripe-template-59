
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
  console.log(`[INITIALIZE-STRIPE-PRODUCTS] ${step}${detailsStr}`);
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
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const checkSecretOnly = requestData.checkSecretOnly || false;
    
    if (checkSecretOnly) {
      logStep("Checking if stripe secret is configured");
      return new Response(JSON.stringify({ 
        secretsReady: !!stripeSecretKey,
      }), {
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
    
    // Check if products already exist
    const existingProducts = await stripe.products.list({ limit: 10, active: true });
    if (existingProducts.data.length > 0) {
      logStep("Products already exist in Stripe", { count: existingProducts.data.length });
      
      // Extract price IDs for existing products
      const priceIds: Record<string, string> = {};
      
      for (const product of existingProducts.data) {
        if (product.name.includes("Standard") || product.name.includes("Premium")) {
          const prices = await stripe.prices.list({ product: product.id, active: true });
          
          for (const price of prices.data) {
            // Determine the plan and interval
            const isStandard = product.name.includes("Standard");
            const interval = price.recurring?.interval;
            const key = `${isStandard ? 'standard' : 'premium'}_${interval}`;
            
            priceIds[key] = price.id;
          }
        }
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Products already exist", 
        priceIds 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // Create product and price structure based on plan configuration
    logStep("Creating products and prices");
    
    // Create Standard plan
    const standardProduct = await stripe.products.create({
      name: "Standard Plan",
      description: "Great for professionals and small teams.",
    });
    logStep("Created Standard product", { id: standardProduct.id });
    
    // Create Premium plan
    const premiumProduct = await stripe.products.create({
      name: "Premium Plan",
      description: "For growing teams with advanced needs.",
    });
    logStep("Created Premium product", { id: premiumProduct.id });
    
    // Create prices for Standard plan
    const standardMonthlyPrice = await stripe.prices.create({
      product: standardProduct.id,
      unit_amount: 1000, // $10.00
      currency: 'usd',
      recurring: { interval: 'month' },
    });
    logStep("Created Standard monthly price", { id: standardMonthlyPrice.id });
    
    const standardYearlyPrice = await stripe.prices.create({
      product: standardProduct.id,
      unit_amount: 10000, // $100.00
      currency: 'usd',
      recurring: { interval: 'year' },
    });
    logStep("Created Standard yearly price", { id: standardYearlyPrice.id });
    
    // Create prices for Premium plan
    const premiumMonthlyPrice = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 2000, // $20.00
      currency: 'usd',
      recurring: { interval: 'month' },
    });
    logStep("Created Premium monthly price", { id: premiumMonthlyPrice.id });
    
    const premiumYearlyPrice = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 20000, // $200.00
      currency: 'usd',
      recurring: { interval: 'year' },
    });
    logStep("Created Premium yearly price", { id: premiumYearlyPrice.id });
    
    // Return the price IDs
    const priceIds = {
      standard_monthly: standardMonthlyPrice.id,
      standard_yearly: standardYearlyPrice.id,
      premium_monthly: premiumMonthlyPrice.id,
      premium_yearly: premiumYearlyPrice.id,
    };
    
    logStep("Products and prices created successfully", { priceIds });
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Products and prices created successfully", 
      priceIds 
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
