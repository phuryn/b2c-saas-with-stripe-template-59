
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import type { User } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logStep } from "./logger.ts";

/**
 * Updates database with subscription data
 */
export const updateDatabase = async (user: User, subscriptionData: any) => {
  // Initialize Supabase client with service role key
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase credentials in environment variables");
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
  
  try {
    // Output more detail to logs for debugging
    console.log("Updating database with:", {
      email: user.email,
      user_id: user.id,
      customer_id: subscriptionData.customer_id,
      subscribed: subscriptionData.subscribed
    });
    
    // Update the database record with the latest subscription info
    const { data, error } = await supabase.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: subscriptionData.customer_id,
      subscribed: subscriptionData.subscribed,
      subscription_tier: subscriptionData.subscription_tier,
      subscription_end: subscriptionData.subscription_end,
      updated_at: new Date().toISOString(),
    }, { 
      onConflict: 'email',
      returning: 'minimal'  // Don't need to return data for performance
    });
    
    if (error) {
      console.error("Error updating subscriber record:", error.message);
      throw new Error(`Database update failed: ${error.message}`);
    }
    
    logStep("Updated database with subscription info", { 
      subscribed: subscriptionData.subscribed, 
      subscriptionTier: subscriptionData.subscription_tier
    });
  } catch (error) {
    console.error("Failed to update subscriber database:", error);
    throw error;
  }
};
