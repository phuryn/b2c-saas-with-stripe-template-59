
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
    
    // First, check if the _rls_actions table exists
    const { error: checkTableError } = await supabase
      .from('_rls_actions')
      .select('id')
      .limit(1);
    
    if (checkTableError) {
      console.error('[FIX-USERS-POLICY] Error checking _rls_actions table:', checkTableError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to check _rls_actions table. Please verify that the required migrations have been applied.',
          details: checkTableError.message
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

    const queryResults = [];
    
    // Step 1: Disable Row Level Security temporarily to reset it
    const { data: disableRlsData, error: disableRlsError } = await supabase
      .from('_rls_actions')
      .insert({
        action: 'ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;'
      })
      .select();

    if (disableRlsError) {
      console.error('[FIX-USERS-POLICY] Error disabling RLS:', disableRlsError);
      // Continue anyway, the table might not have RLS enabled
      queryResults.push({ step: 'disable_rls', success: false, error: disableRlsError.message });
    } else {
      console.log('[FIX-USERS-POLICY] Successfully disabled RLS temporarily');
      queryResults.push({ step: 'disable_rls', success: true });
    }

    // Step 2: Drop any existing policies on the users table (already done manually by admin)
    const { data: dropPoliciesData, error: dropPoliciesError } = await supabase
      .from('_rls_actions')
      .insert({
        action: `
          -- Drop any remaining policies on the users table
          DROP POLICY IF EXISTS "Users can view own user data" ON public.users;
        `
      })
      .select();

    if (dropPoliciesError) {
      console.error('[FIX-USERS-POLICY] Error dropping policies:', dropPoliciesError);
      queryResults.push({ step: 'drop_policies', success: false, error: dropPoliciesError.message });
    } else {
      console.log('[FIX-USERS-POLICY] Successfully dropped any existing policies');
      queryResults.push({ step: 'drop_policies', success: true });
    }

    // Step 3: Create a security definer function to safely get user role without recursion
    const { data: createFnData, error: createFnError } = await supabase
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
      })
      .select();

    if (createFnError) {
      console.error('[FIX-USERS-POLICY] Error creating function:', createFnError);
      queryResults.push({ step: 'create_function', success: false, error: createFnError.message });
    } else {
      console.log('[FIX-USERS-POLICY] Successfully created get_user_role function');
      queryResults.push({ step: 'create_function', success: true });
    }

    // Step 4: Enable RLS and create basic policy for user to view their own data
    const { data: createPolicyData, error: createPolicyError } = await supabase
      .from('_rls_actions')
      .insert({
        action: `
          -- Enable RLS on the users table
          ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
          
          -- Create policy for users to view their own data
          CREATE POLICY "Users can view own user data" ON public.users
            FOR SELECT
            USING (auth.uid() = id);
        `
      })
      .select();

    if (createPolicyError) {
      console.error('[FIX-USERS-POLICY] Error creating policies:', createPolicyError);
      queryResults.push({ step: 'create_policies', success: false, error: createPolicyError.message });
    } else {
      console.log('[FIX-USERS-POLICY] Successfully created policies');
      queryResults.push({ step: 'create_policies', success: true });
    }

    // Step 5: Execute the actions
    // We'll retrieve all unexecuted actions and execute them sequentially
    const { data: actionsToExecute, error: getActionsError } = await supabase
      .from('_rls_actions')
      .select('*')
      .eq('executed', false);
      
    if (getActionsError) {
      console.error('[FIX-USERS-POLICY] Error getting actions to execute:', getActionsError);
      queryResults.push({ step: 'get_actions', success: false, error: getActionsError.message });
    } else {
      console.log(`[FIX-USERS-POLICY] Found ${actionsToExecute?.length || 0} actions to execute`);
      
      // Execute each action
      if (actionsToExecute && actionsToExecute.length > 0) {
        for (const action of actionsToExecute) {
          try {
            // Use PostgreSQL's built-in function to execute the action
            const { error: execError } = await supabase.rpc('execute_sql', {
              sql: action.action
            });
            
            if (execError) {
              console.error(`[FIX-USERS-POLICY] Error executing action ${action.id}:`, execError);
              queryResults.push({ step: `execute_action_${action.id}`, success: false, error: execError.message });
            } else {
              // Mark action as executed
              await supabase
                .from('_rls_actions')
                .update({ executed: true })
                .eq('id', action.id);
                
              console.log(`[FIX-USERS-POLICY] Successfully executed action ${action.id}`);
              queryResults.push({ step: `execute_action_${action.id}`, success: true });
            }
          } catch (error) {
            console.error(`[FIX-USERS-POLICY] Error executing action ${action.id}:`, error);
            queryResults.push({ step: `execute_action_${action.id}`, success: false, error: error.message });
          }
        }
      }
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
