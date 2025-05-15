
-- Function to securely execute SQL from the _rls_actions table
CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execute permission to the service role only
GRANT EXECUTE ON FUNCTION public.execute_sql TO service_role;

-- Create trigger to execute SQL actions automatically if needed
CREATE OR REPLACE FUNCTION public.execute_pending_actions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This could be extended to automatically execute actions
  -- For now, just return NEW to allow the insert
  RETURN NEW;
END;
$$;

-- Create trigger on _rls_actions table
DROP TRIGGER IF EXISTS execute_actions_trigger ON public._rls_actions;
CREATE TRIGGER execute_actions_trigger
  AFTER INSERT ON public._rls_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.execute_pending_actions();
