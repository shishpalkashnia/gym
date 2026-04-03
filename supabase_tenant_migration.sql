-- Step 1: Create gyms table
CREATE TABLE IF NOT EXISTS public.gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Create user_gym mapping table for multi-tenant access
CREATE TABLE IF NOT EXISTS public.user_gym (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 3a: Add gym_id columns without NOT NULL initially to prevent constraint errors
ALTER TABLE public.members
  ADD COLUMN gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE;

ALTER TABLE public.payments
  ADD COLUMN gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE;

-- Step 4: Data migration
DO $$
DECLARE
  v_default_gym_id UUID;
BEGIN
  -- Insert default gym and safely return its UUID
  INSERT INTO public.gyms (name)
  VALUES ('Default Gym')
  RETURNING id INTO v_default_gym_id;

  -- Update existing records sequentially to map to the new default gym
  UPDATE public.members SET gym_id = v_default_gym_id WHERE gym_id IS NULL;
  UPDATE public.payments SET gym_id = v_default_gym_id WHERE gym_id IS NULL;
  
  -- Optionally, link all existing users to this default gym so they retain view access
  INSERT INTO public.user_gym (user_id, gym_id)
  SELECT id, v_default_gym_id FROM auth.users
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_gym WHERE user_id = auth.users.id
  );
END $$;

-- Step 3b: Enforce NOT NULL constraints now that all data is cleanly migrated
ALTER TABLE public.members
  ALTER COLUMN gym_id SET NOT NULL;

ALTER TABLE public.payments
  ALTER COLUMN gym_id SET NOT NULL;

-- Step 5: Add indexes for significant performance boosts in a multi-tenant setup
CREATE INDEX IF NOT EXISTS idx_members_gym_id ON public.members(gym_id);
CREATE INDEX IF NOT EXISTS idx_payments_gym_id ON public.payments(gym_id);
CREATE INDEX IF NOT EXISTS idx_user_gym_user_id ON public.user_gym(user_id);

-- Step 6: Create helper function to fetch the current user's authorized gym_ids
CREATE OR REPLACE FUNCTION public.get_current_user_gym_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT gym_id FROM public.user_gym WHERE user_id = auth.uid();
$$;

-- Step 7: (For Future Reference)
-- Strict RLS is intentionally NOT enabled yet per requirements. 
-- When ready, enable RLS and use policies referencing the helper function:
-- Example: "gym_id IN (SELECT get_current_user_gym_ids())"
