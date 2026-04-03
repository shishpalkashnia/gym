-- ============================================
-- FIX: Allow Public (Anon) Access for Workout Logging
-- Only includes tables that EXIST in your database
-- Run this in your Supabase SQL Editor
-- ============================================

-- STEP 1: Enable RLS on all relevant tables (required before adding policies)
-- If RLS is already enabled, these are safe no-ops
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gym ENABLE ROW LEVEL SECURITY;

-- STEP 2: Add policies to allow public (anon + authenticated) access

-- MEMBERS: Allow anyone to READ (for phone lookup on QR scan)
CREATE POLICY "Allow public read members" ON public.members
  FOR SELECT USING (true);

-- WORKOUTS: Allow anyone to READ and INSERT (log workouts)
CREATE POLICY "Allow public read workouts" ON public.workouts
  FOR SELECT USING (true);
CREATE POLICY "Allow public insert workouts" ON public.workouts
  FOR INSERT WITH CHECK (true);

-- WORKOUT_ENTRIES: Allow anyone to READ and INSERT
CREATE POLICY "Allow public read workout_entries" ON public.workout_entries
  FOR SELECT USING (true);
CREATE POLICY "Allow public insert workout_entries" ON public.workout_entries
  FOR INSERT WITH CHECK (true);

-- WORKOUT_SETS: Allow anyone to READ and INSERT
CREATE POLICY "Allow public read workout_sets" ON public.workout_sets
  FOR SELECT USING (true);
CREATE POLICY "Allow public insert workout_sets" ON public.workout_sets
  FOR INSERT WITH CHECK (true);

-- GYMS: Allow anyone to READ (gym name display)
CREATE POLICY "Allow public read gyms" ON public.gyms
  FOR SELECT USING (true);

-- PAYMENTS: Allow anyone to READ and INSERT
CREATE POLICY "Allow public read payments" ON public.payments
  FOR SELECT USING (true);
CREATE POLICY "Allow public insert payments" ON public.payments
  FOR INSERT WITH CHECK (true);

-- USER_GYM: Allow authenticated users to READ (for admin login)
CREATE POLICY "Allow public read user_gym" ON public.user_gym
  FOR SELECT USING (true);
CREATE POLICY "Allow public insert user_gym" ON public.user_gym
  FOR INSERT WITH CHECK (true);
