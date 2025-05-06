
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-INVOICES] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    // Check if the Stripe key is valid
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey || stripeKey.trim() === "") {
      logStep("Missing Stripe secret key");
      throw new Error("Stripe API key is not configured properly");
    }
    
    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    logStep("Stripe initialized");
    
    // Get authentication token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header provided");
      throw new Error("No authorization header provided");
    }
    
    const token = authHeader.replace("Bearer ", "");
    logStep("Authentication token extracted");
    
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logStep("Supabase configuration is missing");
      throw new Error("Supabase configuration is missing");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    
    // Get user information
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      logStep("Failed to authenticate user", { error: userError });
      throw new Error("Failed to authenticate user");
    }
    
    logStep("User authenticated", { email: user.email });
    
    if (!user.email) {
      logStep("User email not available");
      throw new Error("User email not available");
    }
    
    // Get customer ID using the email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });
    
    if (customers.data.length === 0) {
      logStep("No customer found for user", { email: user.email });
      return new Response(JSON.stringify({ invoices: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }
    
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });
    
    // Fetch invoices
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10,
      status: 'paid'
    });
    
    logStep("Fetched invoices", { count: invoices.data.length });
    
    // Format the response
    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      number: invoice.number || '',
      created: invoice.created,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
      description: invoice.description
    }));

    return new Response(JSON.stringify({ invoices: formattedInvoices }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching invoices:", errorMessage);
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
