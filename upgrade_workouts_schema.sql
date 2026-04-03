-- 1. Create table: body_parts
CREATE TABLE IF NOT EXISTS public.body_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default body parts
INSERT INTO public.body_parts (name) VALUES 
  ('Chest'),
  ('Back'),
  ('Biceps'),
  ('Triceps'),
  ('Shoulders'),
  ('Legs'),
  ('Core')
ON CONFLICT (name) DO NOTHING;

-- 2. Create table: exercises
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  body_part_id UUID REFERENCES public.body_parts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(name, body_part_id)
);

-- Note: We use DO $$ block to dynamically fetch the body_part_id for inserts
DO $$
DECLARE
  v_chest UUID;
  v_back UUID;
  v_biceps UUID;
  v_triceps UUID;
  v_shoulders UUID;
  v_legs UUID;
  v_core UUID;
BEGIN
  SELECT id INTO v_chest FROM public.body_parts WHERE name = 'Chest';
  SELECT id INTO v_back FROM public.body_parts WHERE name = 'Back';
  SELECT id INTO v_biceps FROM public.body_parts WHERE name = 'Biceps';
  SELECT id INTO v_triceps FROM public.body_parts WHERE name = 'Triceps';
  SELECT id INTO v_shoulders FROM public.body_parts WHERE name = 'Shoulders';
  SELECT id INTO v_legs FROM public.body_parts WHERE name = 'Legs';
  SELECT id INTO v_core FROM public.body_parts WHERE name = 'Core';

  -- Chest Exercises
  INSERT INTO public.exercises (name, body_part_id) VALUES 
    ('Flat Bench Press', v_chest),
    ('Incline Bench Press', v_chest),
    ('Decline Bench Press', v_chest),
    ('Pec Deck Fly', v_chest),
    ('Cable Crossover', v_chest),
    ('Push-ups', v_chest)
  ON CONFLICT DO NOTHING;

  -- Back Exercises
  INSERT INTO public.exercises (name, body_part_id) VALUES 
    ('Lat Pulldown', v_back),
    ('Seated Cable Row', v_back),
    ('Barbell Row', v_back),
    ('Pull-ups', v_back),
    ('Deadlift', v_back),
    ('T-Bar Row', v_back)
  ON CONFLICT DO NOTHING;

  -- Biceps Exercises
  INSERT INTO public.exercises (name, body_part_id) VALUES 
    ('Barbell Curl', v_biceps),
    ('Dumbbell Curl', v_biceps),
    ('Hammer Curl', v_biceps),
    ('Preacher Curl', v_biceps),
    ('Concentration Curl', v_biceps)
  ON CONFLICT DO NOTHING;

  -- Triceps Exercises
  INSERT INTO public.exercises (name, body_part_id) VALUES 
    ('Tricep Pushdown', v_triceps),
    ('Overhead Tricep Extension', v_triceps),
    ('Skull Crushers', v_triceps),
    ('Close-Grip Bench Press', v_triceps),
    ('Tricep Dips', v_triceps)
  ON CONFLICT DO NOTHING;

  -- Shoulders Exercises
  INSERT INTO public.exercises (name, body_part_id) VALUES 
    ('Overhead Press', v_shoulders),
    ('Lateral Raise', v_shoulders),
    ('Front Raise', v_shoulders),
    ('Reverse Pec Deck', v_shoulders),
    ('Arnold Press', v_shoulders)
  ON CONFLICT DO NOTHING;

  -- Legs Exercises
  INSERT INTO public.exercises (name, body_part_id) VALUES 
    ('Barbell Squat', v_legs),
    ('Leg Press', v_legs),
    ('Leg Extension', v_legs),
    ('Leg Curl', v_legs),
    ('Calf Raise', v_legs),
    ('Romanian Deadlift', v_legs)
  ON CONFLICT DO NOTHING;

  -- Core Exercises
  INSERT INTO public.exercises (name, body_part_id) VALUES 
    ('Crunches', v_core),
    ('Plank', v_core),
    ('Leg Raises', v_core),
    ('Russian Twists', v_core)
  ON CONFLICT DO NOTHING;
END $$;

-- 3. Update workout_entries: add optional exercise_id
ALTER TABLE public.workout_entries
  ADD COLUMN IF NOT EXISTS exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL;

-- 4. Create an index on member_id and created_at in workouts for faster recent history fetching
CREATE INDEX IF NOT EXISTS idx_workouts_member_id_created_at 
ON public.workouts(member_id, created_at DESC);
