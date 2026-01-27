import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface LatestAnalysis {
  id: string;
  skinType: string | null;
  concerns: string[] | null;
  climate: string | null;
  pollution: string | null;
  score: number | null;
  problems: { title: string; description: string; icon: string }[] | null;
  avoidIngredients: { name: string; reason: string }[] | null;
  prescriptionIngredients: { name: string; reason: string }[] | null;
  createdAt: string;
}

export function useLatestAnalysis() {
  const { user } = useAuth();
  const [latestAnalysis, setLatestAnalysis] = useState<LatestAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLatestAnalysis();
    } else {
      setLatestAnalysis(null);
      setLoading(false);
    }
  }, [user]);

  const fetchLatestAnalysis = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // No rows found is ok
          console.error('Failed to fetch latest analysis:', error);
        }
        setLatestAnalysis(null);
      } else if (data) {
        setLatestAnalysis({
          id: data.id,
          skinType: data.skin_type,
          concerns: data.concerns,
          climate: data.climate,
          pollution: data.pollution,
          score: data.score ? Number(data.score) : null,
          problems: data.problems as LatestAnalysis['problems'],
          avoidIngredients: data.avoid_ingredients as LatestAnalysis['avoidIngredients'],
          prescriptionIngredients: data.prescription_ingredients as LatestAnalysis['prescriptionIngredients'],
          createdAt: data.created_at,
        });
      }
    } catch (err) {
      console.error('Error fetching latest analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    setLoading(true);
    fetchLatestAnalysis();
  };

  return { latestAnalysis, loading, refresh };
}
