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

export interface PreviousAnalysis {
  score: number | null;
  problems: { title: string; description: string; icon: string }[] | null;
  createdAt: string;
}

export function useLatestAnalysis() {
  const { user } = useAuth();
  const [latestAnalysis, setLatestAnalysis] = useState<LatestAnalysis | null>(null);
  const [previousAnalysis, setPreviousAnalysis] = useState<PreviousAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLatestAnalysis();
    } else {
      setLatestAnalysis(null);
      setPreviousAnalysis(null);
      setLoading(false);
    }
  }, [user]);

  const fetchLatestAnalysis = async () => {
    if (!user) return;

    try {
      // Fetch last two analyses for comparison
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2);

      if (error) {
        if (error.code !== 'PGRST116') { // No rows found is ok
          console.error('Failed to fetch latest analysis:', error);
        }
        setLatestAnalysis(null);
        setPreviousAnalysis(null);
      } else if (data && data.length > 0) {
        const latest = data[0];
        setLatestAnalysis({
          id: latest.id,
          skinType: latest.skin_type,
          concerns: latest.concerns,
          climate: latest.climate,
          pollution: latest.pollution,
          score: latest.score ? Number(latest.score) : null,
          problems: latest.problems as LatestAnalysis['problems'],
          avoidIngredients: latest.avoid_ingredients as LatestAnalysis['avoidIngredients'],
          prescriptionIngredients: latest.prescription_ingredients as LatestAnalysis['prescriptionIngredients'],
          createdAt: latest.created_at,
        });

        // Set previous analysis if available
        if (data.length > 1) {
          const previous = data[1];
          setPreviousAnalysis({
            score: previous.score ? Number(previous.score) : null,
            problems: previous.problems as PreviousAnalysis['problems'],
            createdAt: previous.created_at,
          });
        } else {
          setPreviousAnalysis(null);
        }
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

  return { latestAnalysis, previousAnalysis, loading, refresh };
}
