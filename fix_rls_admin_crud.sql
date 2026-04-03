-- ============================================
-- COMPLETE RLS POLICIES (Run AFTER the first fix script)
-- Adds UPDATE and DELETE for admin operations
-- ============================================

-- MEMBERS: Admin needs to update and delete
CREATE POLICY "Allow update members" ON public.members
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete members" ON public.members
  FOR DELETE USING (true);

-- PAYMENTS: Admin needs to update and delete
CREATE POLICY "Allow update payments" ON public.payments
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete payments" ON public.payments
  FOR DELETE USING (true);

-- WORKOUTS: Admin may need to delete
CREATE POLICY "Allow delete workouts" ON public.workouts
  FOR DELETE USING (true);
CREATE POLICY "Allow update workouts" ON public.workouts
  FOR UPDATE USING (true) WITH CHECK (true);

-- WORKOUT_ENTRIES: May need cleanup
CREATE POLICY "Allow delete workout_entries" ON public.workout_entries
  FOR DELETE USING (true);

-- WORKOUT_SETS: May need cleanup
CREATE POLICY "Allow delete workout_sets" ON public.workout_sets
  FOR DELETE USING (true);

-- USER_GYM: Admin needs full control
CREATE POLICY "Allow update user_gym" ON public.user_gym
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete user_gym" ON public.user_gym
  FOR DELETE USING (true);

-- GYMS: Admin needs full control
CREATE POLICY "Allow insert gyms" ON public.gyms
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update gyms" ON public.gyms
  FOR UPDATE USING (true) WITH CHECK (true);
