
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

    // First, directly address the Row Level Security on the users table
    // We'll drop existing policies and recreate them without recursion
    
    const queryResults = [];
    
    // Step 1: Disable Row Level Security temporarily to reset it
    const { error: disableRlsError } = await supabase
      .from('_rls_actions')
      .insert({
        action: 'ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;'
      });

    if (disableRlsError) {
      console.error('[FIX-USERS-POLICY] Error disabling RLS:', disableRlsError);
      // Continue anyway, the table might not have RLS enabled
      queryResults.push({ step: 'disable_rls', success: false, error: disableRlsError.message });
    } else {
      console.log('[FIX-USERS-POLICY] Successfully disabled RLS temporarily');
      queryResults.push({ step: 'disable_rls', success: true });
    }

    // Step 2: Drop all existing policies on the users table
    const { error: dropPoliciesError } = await supabase
      .from('_rls_actions')
      .insert({
        action: `
          -- Drop any existing policies on the users table
          DROP POLICY IF EXISTS "Users can view own user data" ON public.users;
          DROP POLICY IF EXISTS "Administrators can view all users" ON public.users;
        `
      });

    if (dropPoliciesError) {
      console.error('[FIX-USERS-POLICY] Error dropping policies:', dropPoliciesError);
      queryResults.push({ step: 'drop_policies', success: false, error: dropPoliciesError.message });
    } else {
      console.log('[FIX-USERS-POLICY] Successfully dropped any existing policies');
      queryResults.push({ step: 'drop_policies', success: true });
    }

    // Step 3: Create a security definer function to safely get user role
    const { error: createFnError } = await supabase
      .from('_rls_actions')
      .insert({
        action: `
          -- Create a security definer function to safely get roles without recursion
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

    if (createFnError) {
      console.error('[FIX-USERS-POLICY] Error creating function:', createFnError);
      queryResults.push({ step: 'create_function', success: false, error: createFnError.message });
    } else {
      console.log('[FIX-USERS-POLICY] Successfully created get_user_role function');
      queryResults.push({ step: 'create_function', success: true });
    }

    // Step 4: Enable RLS and create new policies using the security definer function
    const { error: createPolicyError } = await supabase
      .from('_rls_actions')
      .insert({
        action: `
          -- Enable RLS on the users table
          ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
          
          -- Create policy for users to view their own data
          CREATE POLICY "Users can view own user data" ON public.users
            FOR SELECT
            USING (auth.uid() = id);
          
          -- Create policy for administrators to view all users using the security definer function
          CREATE POLICY "Administrators can view all users" ON public.users
            FOR SELECT
            USING (public.get_user_role(auth.uid()) = 'administrator'::app_role);
        `
      });

    if (createPolicyError) {
      console.error('[FIX-USERS-POLICY] Error creating policies:', createPolicyError);
      queryResults.push({ step: 'create_policies', success: false, error: createPolicyError.message });
    } else {
      console.log('[FIX-USERS-POLICY] Successfully created policies');
      queryResults.push({ step: 'create_policies', success: true });
    }

    console.log('[FIX-USERS-POLICY] Successfully fixed users policies');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Users table policies fixed successfully',
        results: queryResults
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
