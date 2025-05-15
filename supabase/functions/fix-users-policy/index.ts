
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Initialize Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    console.log('[FIX-USERS-POLICY] Starting policy fix...');

    // Check if there are existing policies that might cause recursion
    const { data: existingPolicies, error: policyError } = await supabase
      .rpc('get_policies', { table_name: 'users' });

    if (policyError) {
      console.error('[FIX-USERS-POLICY] Error checking policies:', policyError);
      throw policyError;
    }

    console.log(`[FIX-USERS-POLICY] Found ${existingPolicies?.length || 0} policies on the users table`);

    // Drop any recursive policies
    if (existingPolicies && existingPolicies.length > 0) {
      for (const policy of existingPolicies) {
        console.log(`[FIX-USERS-POLICY] Dropping policy: ${policy.policyname}`);
        
        const { error: dropError } = await supabase.rpc('drop_policy', { 
          p_table: 'users', 
          p_policy: policy.policyname 
        });
        
        if (dropError) {
          console.error(`[FIX-USERS-POLICY] Error dropping policy ${policy.policyname}:`, dropError);
        }
      }
    }

    // Create a security definer function to safely get user role
    const createFnResult = await supabase.rpc('execute_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
        RETURNS app_role
        LANGUAGE sql
        SECURITY DEFINER
        SET search_path = public
        STABLE
        AS $$
          SELECT role FROM public.users WHERE id = user_id;
        $$;
      `
    });

    if (createFnResult.error) {
      console.error('[FIX-USERS-POLICY] Error creating function:', createFnResult.error);
      throw createFnResult.error;
    }

    // Create new non-recursive policies
    const createPolicyResult = await supabase.rpc('execute_sql', {
      sql: `
        -- Enable RLS on the users table
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for selecting user data
        CREATE POLICY "Users can view own user data" ON public.users
          FOR SELECT
          USING (auth.uid() = id);
          
        -- Create policy for administrators to view all users
        CREATE POLICY "Administrators can view all users" ON public.users
          FOR SELECT
          USING (auth.uid() IN (
            SELECT id FROM public.users WHERE role = 'administrator'
          ));
      `
    });

    if (createPolicyResult.error) {
      console.error('[FIX-USERS-POLICY] Error creating policies:', createPolicyResult.error);
      throw createPolicyResult.error;
    }

    console.log('[FIX-USERS-POLICY] Successfully fixed users policies');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Users table policies fixed successfully'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[FIX-USERS-POLICY] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});
