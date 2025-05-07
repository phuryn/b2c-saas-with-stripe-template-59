
// This is a script to help debug the infinite recursion error in the users table policy
// We'll log the policies on the users table to help diagnose the issue

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration is missing");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    
    // Get the policies on the users table using raw SQL
    const { data: policies, error: policiesError } = await supabase.rpc('get_policies_for_table', {
      table_name: 'users'
    });
    
    if (policiesError) {
      throw new Error(`Error getting policies: ${policiesError.message}`);
    }
    
    console.log("Policies on users table:", policies);
    
    return new Response(JSON.stringify({
      message: "This function is used to debug the infinite recursion error in the users table policy",
      data: {
        policies
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
