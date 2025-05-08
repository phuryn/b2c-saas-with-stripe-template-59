
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
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
  
  // Update the database record with the latest subscription info
  await supabase.from("subscribers").upsert({
    email: user.email,
    user_id: user.id,
    stripe_customer_id: subscriptionData.customer_id,
    subscribed: subscriptionData.subscribed,
    subscription_tier: subscriptionData.subscription_tier,
    subscription_end: subscriptionData.subscription_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'email' });
  
  logStep("Updated database with subscription info", { 
    subscribed: subscriptionData.subscribed, 
    subscriptionTier: subscriptionData.subscription_tier
  });
};
