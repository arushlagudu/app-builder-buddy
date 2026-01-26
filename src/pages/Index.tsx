import { useState, useCallback, useEffect } from 'react';
import { Sparkles, User, LogOut, Crown, ScanFace } from 'lucide-react';
import { SkinForm } from '@/components/skin/SkinForm';
import { ImageCapture } from '@/components/skin/ImageCapture';
import { AnalysisResults } from '@/components/skin/AnalysisResults';
import { BottomNav } from '@/components/skin/BottomNav';
import { HistoryView } from '@/components/skin/HistoryView';
import { ProgressTimeline } from '@/components/skin/ProgressTimeline';
import { ProductScanner } from '@/components/skin/ProductScanner';
import { TrendAnalytics } from '@/components/skin/TrendAnalytics';
import { AISkinCoach } from '@/components/skin/AISkinCoach';
import { FirstScanRequired } from '@/components/skin/FirstScanRequired';
import { PremiumBanner } from '@/components/premium/PremiumBanner';
import { AuthModal } from '@/components/auth/AuthModal';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useOnboarding } from '@/hooks/useOnboarding';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SkinFormData {
  skinType: string;
  concerns: string[];
  climate: string;
  pollution: string;
}

interface AnalysisData {
  score: number;
  problems: { title: string; description: string; icon: 'hydration' | 'inflammation' | 'barrier' }[];
  deepAnalysis: string;
  avoidIngredients: { name: string; reason: string }[];
  prescriptionIngredients: { name: string; reason: string }[];
  routine: { time: 'AM' | 'PM' | 'BOTH'; step: number; product: string; productLink?: string; reason: string }[];
}

export default function Index() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { isPremium, scansRemaining, canScan, incrementScanCount } = useSubscription();
  const { hasSeenOnboarding, isLoading: onboardingLoading, completeOnboarding } = useOnboarding();
  const [activeTab, setActiveTab] = useState<'scan' | 'history' | 'progress' | 'scanner' | 'coach' | 'settings'>('scan');
  const [formData, setFormData] = useState<SkinFormData | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisData | null>(null);
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedFirstScan, setHasCompletedFirstScan] = useState(false);

  // Check if user has completed at least one scan
  useEffect(() => {
    const checkFirstScan = async () => {
      if (!user) {
        setHasCompletedFirstScan(false);
        return;
      }

      const { data, error } = await supabase
        .from('analysis_history')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!error && data && data.length > 0) {
        setHasCompletedFirstScan(true);
      } else {
        setHasCompletedFirstScan(false);
      }
    };

    checkFirstScan();
  }, [user]);

  // Update hasCompletedFirstScan when user completes a new analysis
  useEffect(() => {
    if (analysisResults && user) {
      setHasCompletedFirstScan(true);
    }
  }, [analysisResults, user]);

  // Show onboarding for new users
  useEffect(() => {
    if (!onboardingLoading && !hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [onboardingLoading, hasSeenOnboarding]);

  const handleCompleteOnboarding = () => {
    completeOnboarding();
    setShowOnboarding(false);
  };

  const isFormValid = formData?.skinType && formData.concerns.length > 0 && formData.climate && formData.pollution;

  const handleFormSubmit = useCallback((data: SkinFormData) => {
    setFormData(data);
    setShowValidationWarning(false);
  }, []);

  const handleImageCapture = useCallback((data: string) => {
    setImageData(data);
  }, []);

  const saveAnalysisToHistory = async (analysisData: AnalysisData) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('analysis_history').insert({
        user_id: user.id,
        skin_type: formData?.skinType,
        concerns: formData?.concerns,
        climate: formData?.climate,
        pollution: formData?.pollution,
        score: analysisData.score,
        problems: analysisData.problems,
        deep_analysis: analysisData.deepAnalysis,
        avoid_ingredients: analysisData.avoidIngredients,
        prescription_ingredients: analysisData.prescriptionIngredients,
        routine: analysisData.routine,
      });

      if (error) throw error;
    } catch (err) {
      console.error('Failed to save analysis:', err);
    }
  };

  const handleStartAnalysis = async () => {
    if (!isFormValid) {
      setShowValidationWarning(true);
      toast.error('Please complete the skin profile form above');
      return;
    }

    if (!imageData) {
      toast.error('Please capture or upload a photo');
      return;
    }

    // Check scan limits for free users
    if (!isPremium && !canScan) {
      toast.error('No free scans remaining. Upgrade to Premium for unlimited scans!');
      return;
    }

    setIsScanning(true);
    setShowValidationWarning(false);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-skin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          image: imageData,
          skinType: formData?.skinType,
          concerns: formData?.concerns,
          climate: formData?.climate,
          pollution: formData?.pollution,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
          return;
        } else if (response.status === 402) {
          toast.error('AI credits exhausted. Please add credits to continue.');
          return;
        }
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setAnalysisResults(data);

      // Increment scan count for free users
      if (!isPremium) {
        await incrementScanCount();
      }
      
      // Save to history if user is logged in
      if (user) {
        await saveAnalysisToHistory(data);
        toast.success('Analysis complete and saved to history!');
      } else {
        toast.success('Analysis complete! Sign in to save your history.');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error('Failed to analyze skin. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDownloadReport = () => {
    if (!analysisResults) return;
    
    const report = `
DERMATOLOGICAL INTELLIGENCE REPORT
===================================

SKIN HEALTH SCORE: ${analysisResults.score}/10

CORE PROBLEMS IDENTIFIED:
${analysisResults.problems.map(p => `• ${p.title}: ${p.description}`).join('\n')}

DEEP ANALYSIS:
${analysisResults.deepAnalysis}

INGREDIENTS TO AVOID:
${analysisResults.avoidIngredients.map(i => `• ${i.name}: ${i.reason}`).join('\n')}

PRESCRIPTION INGREDIENTS:
${analysisResults.prescriptionIngredients.map(i => `• ${i.name}: ${i.reason}`).join('\n')}

PERSONALIZED ROUTINE:

MORNING:
${analysisResults.routine.filter(s => s.time === 'AM' || s.time === 'BOTH').map(s => `${s.step}. ${s.product}\n   Reason: ${s.reason}`).join('\n')}

EVENING:
${analysisResults.routine.filter(s => s.time === 'PM' || s.time === 'BOTH').map(s => `${s.step}. ${s.product}\n   Reason: ${s.reason}`).join('\n')}

===================================
Generated by Dermatological Intelligence
    `;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skin-analysis-report.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded!');
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  const handleUpgrade = () => {
    toast.info('Stripe integration coming soon! Enable it in settings.');
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card mx-4 mt-4 mb-6 rounded-2xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Dermatological Intelligence
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {isPremium && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/20 text-secondary">
                <Crown className="w-3 h-3" />
                <span className="text-xs font-medium">PRO</span>
              </div>
            )}
            
            {!authLoading && (
              user ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              )
            )}
          </div>
        </div>
      </header>

      <main className="px-4 space-y-6">
        {activeTab === 'scan' && (
          <>
            {/* Premium Banner for free users */}
            {!isPremium && user && <PremiumBanner onUpgrade={handleUpgrade} />}

            {!analysisResults ? (
              <>
                <SkinForm onSubmit={handleFormSubmit} isValid={!!isFormValid} />
                <ImageCapture
                  onImageCapture={handleImageCapture}
                  isScanning={isScanning}
                  showValidationWarning={showValidationWarning}
                  onDismissWarning={() => setShowValidationWarning(false)}
                />
                {imageData && !isScanning && (
                  <button
                    onClick={handleStartAnalysis}
                    disabled={isScanning}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold text-lg pulse-glow btn-shine disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!isPremium && scansRemaining !== Infinity && (
                      <span className="text-xs opacity-80 mr-2">({scansRemaining} scans left)</span>
                    )}
                    Initiate Diagnostic
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAnalysisResults(null);
                    setImageData(null);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← New Analysis
                </button>
                <AnalysisResults data={analysisResults} onDownloadReport={handleDownloadReport} />
              </>
            )}
          </>
        )}

        {activeTab === 'progress' && (
          hasCompletedFirstScan ? (
            <>
              <ProgressTimeline />
              <TrendAnalytics />
            </>
          ) : (
            <FirstScanRequired 
              onGoToScan={() => setActiveTab('scan')} 
              featureName="Progress Timeline"
              description="Track your skin's improvement over time with before/after comparisons and trend analysis."
            />
          )
        )}

        {activeTab === 'scanner' && (
          hasCompletedFirstScan ? (
            <ProductScanner skinType={formData?.skinType} concerns={formData?.concerns} />
          ) : (
            <FirstScanRequired 
              onGoToScan={() => setActiveTab('scan')} 
              featureName="Product Scanner"
              description="Check if skincare products are compatible with your unique skin profile."
            />
          )
        )}

        {activeTab === 'coach' && (
          hasCompletedFirstScan ? (
            <AISkinCoach 
              skinType={formData?.skinType} 
              concerns={formData?.concerns}
              climate={formData?.climate}
            />
          ) : (
            <FirstScanRequired 
              onGoToScan={() => setActiveTab('scan')} 
              featureName="AI Skin Coach"
              description="Get personalized daily tips and routine recommendations tailored to your skin."
            />
          )
        )}

        {activeTab === 'history' && <HistoryView />}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="glass-card p-6">
              <h2 className="font-semibold mb-4">Account</h2>
              {user ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Signed in as:</p>
                  <p className="text-sm font-medium">{user.email}</p>
                  {isPremium ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/20">
                      <Crown className="w-4 h-4 text-secondary" />
                      <span className="text-sm text-secondary font-medium">Premium Member</span>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Free tier: {scansRemaining} scans remaining
                    </div>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full py-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors text-sm"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Sign in to save your analysis history and track skin improvements over time.
                  </p>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="w-full py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
                  >
                    Sign In / Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* Tutorial Replay */}
            <div className="glass-card p-6">
              <h2 className="font-semibold mb-2">Help & Support</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Need a refresher on how to use the app?
              </p>
              <button
                onClick={() => setShowOnboarding(true)}
                className="w-full py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Replay Tutorial
              </button>
            </div>

            {!isPremium && user && (
              <PremiumBanner onUpgrade={handleUpgrade} />
            )}
          </div>
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <OnboardingModal isOpen={showOnboarding} onComplete={handleCompleteOnboarding} />
    </div>
  );
}
