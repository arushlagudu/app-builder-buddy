
-- Table to store scar scan results
CREATE TABLE public.scar_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT,
  scar_type TEXT,
  scar_name TEXT,
  severity TEXT,
  possible_causes TEXT[],
  natural_remedies JSONB,
  product_recommendations JSONB,
  removal_timeline TEXT,
  prevention_tips TEXT[],
  detailed_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scar_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scar scans" ON public.scar_scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scar scans" ON public.scar_scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scar scans" ON public.scar_scans FOR DELETE USING (auth.uid() = user_id);

-- Add scar_scans_used to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN scar_scans_used INTEGER NOT NULL DEFAULT 0;
