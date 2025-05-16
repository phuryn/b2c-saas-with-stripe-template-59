
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-PORTAL-CONFIG] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    logStep("Function started");
    
    // Authenticate user and verify admin role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR", { message: "No authorization header provided" });
      throw new Error("No authorization header provided");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("ERROR", { message: `Authentication error: ${userError.message}` });
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user?.id) {
      logStep("ERROR", { message: "User not authenticated" });
      throw new Error("User not authenticated");
    }
    
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
    
    if (roleError) {
      logStep("ERROR", { message: `Failed to verify role: ${roleError.message}` });
      throw new Error(`Failed to verify role: ${roleError.message}`);
    }
    
    if (roleData?.role !== "administrator") {
      logStep("ERROR", { message: "Only administrators can perform this action" });
      throw new Error("Only administrators can perform this action");
    }
    
    // Get the latest portal configuration
    const { data: configData, error: configError } = await adminClient
      .from("stripe_portal_config")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (configError && configError.code !== 'PGRST116') {
      // PGRST116 is the "no rows returned" error, which we handle separately
      logStep("ERROR", { message: `Failed to fetch configuration: ${configError.message}` });
      throw new Error(`Failed to fetch configuration: ${configError.message}`);
    }
    
    // Check if we have any configuration
    if (!configData) {
      logStep("No active configuration found");
      return new Response(JSON.stringify({ 
        success: true,
        configExists: false,
        message: "No portal configuration found" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    logStep("Configuration found", { configId: configData.config_id });
    
    return new Response(JSON.stringify({ 
      success: true,
      configExists: true,
      config: {
        config_id: configData.config_id,
        app_url: configData.app_url,
        features: configData.features,
        created_at: configData.created_at,
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
