import { useState, useCallback, useEffect } from 'react';
import { Dna, User, LogOut, Gem, Settings } from 'lucide-react';
import { SkinForm } from '@/components/skin/SkinForm';
import { ImageCapture } from '@/components/skin/ImageCapture';
import { AnalysisResults } from '@/components/skin/AnalysisResults';
import { BottomNav } from '@/components/skin/BottomNav';
import { HistoryView } from '@/components/skin/HistoryView';
import { RoutineHistory } from '@/components/skin/RoutineHistory';
import { ProgressTimeline } from '@/components/skin/ProgressTimeline';
import { ProductScanner } from '@/components/skin/ProductScanner';
import { ScarScanner } from '@/components/skin/ScarScanner';
import { TrendAnalytics } from '@/components/skin/TrendAnalytics';
import { AISkinCoach } from '@/components/skin/AISkinCoach';
import { StreakTracker } from '@/components/skin/StreakTracker';
import { AchievementBadges } from '@/components/skin/AchievementBadges';
import { FirstScanRequired } from '@/components/skin/FirstScanRequired';
import { PremiumBanner } from '@/components/premium/PremiumBanner';
import { PremiumUpgradeModal } from '@/components/premium/PremiumUpgradeModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { SkynLanding } from '@/components/skin/SkynLanding';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useLatestAnalysis } from '@/hooks/useLatestAnalysis';
import { registerServiceWorker } from '@/lib/serviceWorker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SkinFormData {
  skinType: string;
  concerns: string[];
  climate: string;
  pollution: string;
  budget: string;
  analysisTier: 'basic' | 'advanced' | 'premium';
}

interface AnalysisData {
  score: number;
  problems: { title: string; description: string; icon: 'hydration' | 'inflammation' | 'barrier' }[];
  deepAnalysis: string;
  avoidIngredients: { name: string; reason: string }[];
  prescriptionIngredients: { name: string; reason: string }[];
  routine: { time: 'AM' | 'PM' | 'BOTH'; step: number; product: string; productLink?: string; reason: string; price?: number }[];
}

export default function Index() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { isPremium, scansRemaining, canScan, incrementScanCount } = useSubscription();
  const { hasSeenOnboarding, isLoading: onboardingLoading, completeOnboarding } = useOnboarding();
  const { latestAnalysis, previousAnalysis, refresh: refreshLatestAnalysis } = useLatestAnalysis();
  const [activeTab, setActiveTab] = useState<'scan' | 'history' | 'progress' | 'scanner' | 'skyn' | 'coach' | 'routines' | 'streaks' | 'settings'>('skyn');
  const [scannerSubTab, setScannerSubTab] = useState<'product' | 'scar'>('product');
  const [formData, setFormData] = useState<SkinFormData | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisData | null>(null);
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumTrigger, setPremiumTrigger] = useState<'scan_limit' | 'routine' | 'progress' | 'scanner' | 'coach' | 'analytics' | 'history' | 'first_results'>('scan_limit');
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

  // Update hasCompletedFirstScan when user completes a new analysis + trigger premium modal after first scan
  useEffect(() => {
    if (analysisResults && user) {
      const wasFirstScan = !hasCompletedFirstScan;
      setHasCompletedFirstScan(true);
      
      // Auto-show premium modal after first scan results
      if (wasFirstScan && !isPremium) {
        setTimeout(() => {
          setPremiumTrigger('first_results');
          setShowPremiumModal(true);
        }, 3000);
      }
    }
  }, [analysisResults, user]);

  // Show onboarding for new users
  useEffect(() => {
    if (!onboardingLoading && !hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [onboardingLoading, hasSeenOnboarding]);

  // Register service worker for notifications
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const handleCompleteOnboarding = () => {
    completeOnboarding();
    setShowOnboarding(false);
    // Auto-navigate to scan tab after onboarding
    setActiveTab('scan');
  };

  const isFormValid = formData?.skinType && formData.concerns.length > 0 && formData.climate && formData.pollution && formData.budget && formData.analysisTier;

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
        image_url: imageData,
      });

      if (error) throw error;

      // Also save a progress photo linked to this analysis
      try {
        // Get the analysis ID we just inserted
        const { data: latestRow } = await supabase
          .from('analysis_history')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestRow && imageData) {
          await supabase.from('progress_photos').insert({
            user_id: user.id,
            image_url: imageData,
            skin_score: analysisData.score,
            analysis_id: latestRow.id,
            notes: `Auto-captured from ${formData?.analysisTier || 'basic'} scan`,
          });
        }
      } catch (progressErr) {
        console.error('Failed to save progress photo:', progressErr);
      }

      // Also save the basic routine to generated_routines for the Routines tab
      const amSteps = analysisData.routine.filter(s => s.time === 'AM' || s.time === 'BOTH');
      const pmSteps = analysisData.routine.filter(s => s.time === 'PM' || s.time === 'BOTH');
      
      const morningRoutine = amSteps.map((step, idx) => ({
        step: idx + 1,
        productType: 'Product',
        productName: step.product,
        frequency: 'Daily',
        howToUse: step.reason,
        reason: step.reason,
        productLink: step.productLink,
      }));
      
      const eveningRoutine = pmSteps.map((step, idx) => ({
        step: idx + 1,
        productType: 'Product',
        productName: step.product,
        frequency: 'Daily',
        howToUse: step.reason,
        reason: step.reason,
        productLink: step.productLink,
      }));

      await supabase.from('generated_routines').insert({
        user_id: user.id,
        routine_type: 'basic',
        intensity: formData?.analysisTier || 'basic',
        routine_title: `${formData?.analysisTier?.charAt(0).toUpperCase()}${formData?.analysisTier?.slice(1)} Scan Routine`,
        routine_summary: `Generated from your ${formData?.analysisTier || 'basic'} skin analysis`,
        morning_routine: morningRoutine,
        evening_routine: eveningRoutine,
        tips: ['Apply thinnest to thickest consistency', 'Wait 1-2 minutes between actives'],
        skin_type: formData?.skinType,
        concerns: formData?.concerns,
        score: analysisData.score,
      });
    } catch (err) {
      console.error('Failed to save analysis:', err);
    }
  };

  const handleStartAnalysis = async () => {
    // Require authentication for scanning
    if (!user) {
      toast.error('Please sign in to analyze your skin');
      setShowAuthModal(true);
      return;
    }

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
      setPremiumTrigger('scan_limit');
      setShowPremiumModal(true);
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
          budget: formData?.budget,
          analysisTier: formData?.analysisTier,
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
        refreshLatestAnalysis(); // Refresh the latest analysis for other features
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

  const handleUpgrade = (trigger: 'scan_limit' | 'routine' | 'progress' | 'scanner' | 'coach' | 'analytics' | 'history' | 'first_results' = 'scan_limit') => {
    setPremiumTrigger(trigger);
    setShowPremiumModal(true);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card mx-4 mb-6 rounded-2xl" style={{ marginTop: 'calc(env(safe-area-inset-top, 0px) + 4px)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Dna className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">
              SKYN
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {isPremium && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/20 text-secondary">
                <Gem className="w-3 h-3" />
                <span className="text-xs font-medium">PRO</span>
              </div>
            )}
            
            {user && (
              <button
                onClick={() => setActiveTab('settings')}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
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
            {!isPremium && user && <PremiumBanner onUpgrade={() => handleUpgrade('scan_limit')} />}

            {!analysisResults ? (
              <>
                <SkinForm onSubmit={handleFormSubmit} isValid={!!isFormValid} isPremium={isPremium} onUpgradeClick={() => handleUpgrade('routine')} />
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
                      <span className="text-xs opacity-80 mr-2">({scansRemaining} scan{scansRemaining !== 1 ? 's' : ''} left)</span>
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
                <AnalysisResults 
                  data={analysisResults} 
                  skinType={formData?.skinType}
                  concerns={formData?.concerns}
                  climate={formData?.climate}
                  pollution={formData?.pollution}
                  onDownloadReport={handleDownloadReport}
                  isPremium={isPremium}
                  onUpgradeClick={() => handleUpgrade('routine')}
                />
              </>
            )}
          </>
        )}

        {activeTab === 'progress' && (
          !isPremium ? (
            <FirstScanRequired 
              onGoToScan={() => handleUpgrade('progress')} 
              featureName="Progress Timeline"
              description="Track your skin's evolution with AI-powered visual comparisons, milestone tracking, and personalized improvement insights based on your unique dermatological profile."
              isPremiumFeature={true}
            />
          ) : hasCompletedFirstScan ? (
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
            <div className="space-y-4">
              {/* Sub-tab selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setScannerSubTab('product')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                    scannerSubTab === 'product'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Product Scanner
                </button>
                <button
                  onClick={() => setScannerSubTab('scar')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                    scannerSubTab === 'scar'
                      ? 'bg-secondary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Scar Scanner
                </button>
              </div>

              {scannerSubTab === 'product' ? (
                isPremium ? (
                  <ProductScanner 
                    skinType={latestAnalysis?.skinType || formData?.skinType} 
                    concerns={latestAnalysis?.concerns || formData?.concerns}
                    score={latestAnalysis?.score}
                    problems={latestAnalysis?.problems}
                    avoidIngredients={latestAnalysis?.avoidIngredients}
                    prescriptionIngredients={latestAnalysis?.prescriptionIngredients}
                  />
                ) : (
                  <FirstScanRequired 
                    onGoToScan={() => handleUpgrade('scanner')} 
                    featureName="Product Scanner"
                    description="Leverage computer vision to instantly decode ingredient labels, cross-reference against your personalized avoid-list, and get AI-powered compatibility scores tailored to your skin's unique chemistry."
                    isPremiumFeature={true}
                  />
                )
              ) : (
                <ScarScanner />
              )}
            </div>
          ) : (
            <FirstScanRequired 
              onGoToScan={() => setActiveTab('scan')} 
              featureName="Product/Scar Scanner"
              description="Check if skincare products are compatible with your skin, or scan any scar or mark for AI-powered identification and treatment."
            />
          )
        )}

        {activeTab === 'coach' && (
          hasCompletedFirstScan ? (
            <AISkinCoach 
              skinType={latestAnalysis?.skinType || formData?.skinType} 
              concerns={latestAnalysis?.concerns || formData?.concerns}
              climate={latestAnalysis?.climate || formData?.climate}
              score={latestAnalysis?.score}
              previousScore={previousAnalysis?.score}
              problems={latestAnalysis?.problems}
              avoidIngredients={latestAnalysis?.avoidIngredients}
              prescriptionIngredients={latestAnalysis?.prescriptionIngredients}
              lastScanDate={latestAnalysis?.createdAt}
              onUpgrade={() => handleUpgrade('coach')}
            />
          ) : (
            <FirstScanRequired 
              onGoToScan={() => setActiveTab('scan')} 
              featureName="AI Skin Coach"
              description="Get personalized daily tips and routine recommendations tailored to your skin."
            />
          )
        )}

        {activeTab === 'history' && (
          !isPremium ? (
            <FirstScanRequired 
              onGoToScan={() => handleUpgrade('history')} 
              featureName="Analysis History"
              description="Unlock your complete diagnostic archive with unlimited access to past analyses, long-term trend visualization, and data-driven insights that reveal patterns in your skin's behavior over time."
              isPremiumFeature={true}
            />
          ) : (
            <HistoryView />
          )
        )}

        {activeTab === 'routines' && (
          <RoutineHistory />
        )}

        {activeTab === 'skyn' && (
          <SkynLanding 
            onStartTutorial={() => setShowOnboarding(true)}
            onGoToScan={() => setActiveTab('scan')}
            hasCompletedScan={hasCompletedFirstScan}
            onUpgrade={() => handleUpgrade('scan_limit')}
            latestAnalysis={latestAnalysis}
            previousAnalysis={previousAnalysis}
            user={user}
            onGoToCoach={() => setActiveTab('coach')}
          />
        )}

        {activeTab === 'streaks' && (
          <div className="space-y-6">
            <StreakTracker />
            <AchievementBadges />
          </div>
        )}

        {activeTab === 'settings' && (
          <SettingsPage />
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <OnboardingModal isOpen={showOnboarding} onComplete={handleCompleteOnboarding} />
      <PremiumUpgradeModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)} 
        trigger={premiumTrigger}
      />
    </div>
  );
}
