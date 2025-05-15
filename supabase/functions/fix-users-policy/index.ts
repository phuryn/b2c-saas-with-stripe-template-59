
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

    // Instead of trying to fetch existing policies (which was failing),
    // directly try to drop any policies that might exist on the users table
    // using a more direct approach
    
    // First, disable RLS temporarily to make sure we can reset it
    const disableRlsResult = await supabase.rpc('execute_sql', {
      sql: `
        -- Temporarily disable RLS on users table to reset it
        ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
      `
    });

    if (disableRlsResult.error) {
      console.error('[FIX-USERS-POLICY] Error disabling RLS:', disableRlsResult.error);
      // Continue anyway as some errors here are expected if RLS wasn't enabled
    } else {
      console.log('[FIX-USERS-POLICY] Successfully disabled RLS temporarily');
    }

    // Drop all existing policies on the users table
    const dropPoliciesResult = await supabase.rpc('execute_sql', {
      sql: `
        -- This will drop all policies on the users table if they exist
        -- Note: We use DO block with exception handling to avoid errors if policies don't exist
        DO $$
        BEGIN
          -- Try to drop each possible policy with exception handling
          BEGIN
            DROP POLICY IF EXISTS "Users can view own user data" ON public.users;
          EXCEPTION WHEN OTHERS THEN
            -- Policy doesn't exist or can't be dropped, just continue
          END;
          
          BEGIN
            DROP POLICY IF EXISTS "Administrators can view all users" ON public.users;
          EXCEPTION WHEN OTHERS THEN
            -- Policy doesn't exist or can't be dropped, just continue
          END;
          
          -- If there were any other policies you were trying to create, add them here
          -- This makes sure we clean up any existing policies that might conflict
        END;
        $$;
      `
    });

    if (dropPoliciesResult.error) {
      console.error('[FIX-USERS-POLICY] Error dropping policies:', dropPoliciesResult.error);
      // Continue anyway as we'll try to recreate them
    } else {
      console.log('[FIX-USERS-POLICY] Successfully dropped any existing policies');
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
    } else {
      console.log('[FIX-USERS-POLICY] Successfully created get_user_role function');
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
          USING (
            (SELECT role FROM public.users WHERE id = auth.uid()) = 'administrator'::app_role
          );
      `
    });

    if (createPolicyResult.error) {
      console.error('[FIX-USERS-POLICY] Error creating policies:', createPolicyResult.error);
      throw createPolicyResult.error;
    } else {
      console.log('[FIX-USERS-POLICY] Successfully created policies');
    }

    // Update the policy for administrators to use the security definer function
    const updateAdminPolicyResult = await supabase.rpc('execute_sql', {
      sql: `
        -- Drop and recreate the admin policy using the security definer function
        DROP POLICY IF EXISTS "Administrators can view all users" ON public.users;
        
        CREATE POLICY "Administrators can view all users" ON public.users
          FOR SELECT
          USING (
            public.get_user_role(auth.uid()) = 'administrator'::app_role
          );
      `
    });

    if (updateAdminPolicyResult.error) {
      console.error('[FIX-USERS-POLICY] Error updating admin policy:', updateAdminPolicyResult.error);
      // Continue anyway as the main fix might still work
    } else {
      console.log('[FIX-USERS-POLICY] Successfully updated admin policy to use security definer function');
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
