
-- This table will be used by the fix-users-policy edge function
-- to execute SQL commands securely
CREATE TABLE IF NOT EXISTS public._rls_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed BOOLEAN DEFAULT FALSE
);

-- Grant access to the service role
GRANT ALL ON public._rls_actions TO service_role;
