
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logStep } from "./logger.ts";

/**
 * Verifies user authentication from request
 */
export const verifyAuth = async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("No authorization header provided");
  logStep("Authorization header found");

  const token = authHeader.replace("Bearer ", "");
  logStep("Authenticating user with token");
  
  // Initialize Supabase client with service role key
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase configuration is missing");
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
  
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError) throw new Error(`Authentication error: ${userError.message}`);
  const user = userData.user;
  if (!user?.email) throw new Error("User not authenticated or email not available");
  logStep("User authenticated", { userId: user.id, email: user.email });
  
  return user;
};
