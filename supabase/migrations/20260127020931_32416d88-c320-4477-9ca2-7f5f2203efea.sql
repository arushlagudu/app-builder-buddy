-- Create table for storing generated routines
CREATE TABLE public.generated_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  routine_type TEXT NOT NULL DEFAULT 'advanced', -- 'basic' for analysis routines, 'advanced' for customized routines
  intensity TEXT, -- 'simple', 'medium', 'intense' (for advanced routines)
  routine_title TEXT,
  routine_summary TEXT,
  morning_routine JSONB,
  evening_routine JSONB,
  weekly_treatments JSONB,
  tips JSONB,
  skin_type TEXT,
  concerns TEXT[],
  score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.generated_routines ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own routines"
  ON public.generated_routines
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routines"
  ON public.generated_routines
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own routines"
  ON public.generated_routines
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_generated_routines_user_id ON public.generated_routines(user_id);
CREATE INDEX idx_generated_routines_created_at ON public.generated_routines(created_at DESC);