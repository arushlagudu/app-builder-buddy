-- Modify ai_coach_usage to use tokens instead of questions
ALTER TABLE public.ai_coach_usage 
  RENAME COLUMN questions_used TO tokens_used;

-- Add custom_name column to generated_routines for user-editable names
ALTER TABLE public.generated_routines
  ADD COLUMN custom_name TEXT DEFAULT NULL;

-- Create a table to store chat messages for AI Coach
CREATE TABLE public.ai_coach_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_coach_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own messages" 
ON public.ai_coach_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" 
ON public.ai_coach_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" 
ON public.ai_coach_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add UPDATE policy for generated_routines so users can rename
CREATE POLICY "Users can update own routines" 
ON public.generated_routines 
FOR UPDATE 
USING (auth.uid() = user_id);