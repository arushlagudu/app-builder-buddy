-- Create table for tracking daily routine completions
CREATE TABLE public.routine_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  routine_type TEXT NOT NULL CHECK (routine_type IN ('morning', 'evening')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, completed_at, routine_type)
);

-- Create user streak stats table for caching streak data
CREATE TABLE public.user_streak_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  total_completions INTEGER NOT NULL DEFAULT 0,
  last_completion_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.routine_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streak_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for routine_streaks
CREATE POLICY "Users can view own streaks" ON public.routine_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" ON public.routine_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own streaks" ON public.routine_streaks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for user_streak_stats
CREATE POLICY "Users can view own streak stats" ON public.user_streak_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak stats" ON public.user_streak_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak stats" ON public.user_streak_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to update streak stats when a routine is completed
CREATE OR REPLACE FUNCTION public.update_streak_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_total INTEGER;
BEGIN
  -- Get or create stats record
  SELECT last_completion_date, current_streak, longest_streak, total_completions
  INTO v_last_date, v_current_streak, v_longest_streak, v_total
  FROM user_streak_stats
  WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    -- First completion ever
    INSERT INTO user_streak_stats (user_id, current_streak, longest_streak, total_completions, last_completion_date)
    VALUES (NEW.user_id, 1, 1, 1, NEW.completed_at);
  ELSE
    v_total := v_total + 1;
    
    IF v_last_date IS NULL OR NEW.completed_at > v_last_date THEN
      IF v_last_date IS NULL OR NEW.completed_at = v_last_date + INTERVAL '1 day' THEN
        -- Consecutive day
        v_current_streak := v_current_streak + 1;
      ELSIF NEW.completed_at > v_last_date + INTERVAL '1 day' THEN
        -- Streak broken, reset
        v_current_streak := 1;
      END IF;
      
      IF v_current_streak > v_longest_streak THEN
        v_longest_streak := v_current_streak;
      END IF;
      
      UPDATE user_streak_stats
      SET current_streak = v_current_streak,
          longest_streak = v_longest_streak,
          total_completions = v_total,
          last_completion_date = NEW.completed_at,
          updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update stats on completion
CREATE TRIGGER on_routine_completed
  AFTER INSERT ON public.routine_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_streak_stats();