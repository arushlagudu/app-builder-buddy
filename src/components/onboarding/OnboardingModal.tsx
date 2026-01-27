import { useState } from 'react';
import { 
  Dialog, 
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Dna, 
  ScanFace, 
  TrendingUp, 
  Camera, 
  MessageCircle, 
  ChevronRight,
  ChevronLeft,
  Droplets,
  Shield,
  Zap,
  Star
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Dermatological Intelligence',
    subtitle: 'Your AI-Powered Skin Analysis Companion',
    description: 'Get clinical-grade skin analysis and personalized skincare routines powered by advanced AI. Let\'s get you started!',
    note: '💡 You can replay this tutorial anytime from Settings',
    icon: Dna,
    features: [
      { icon: Shield, label: 'Science-backed analysis' },
      { icon: Droplets, label: 'Personalized routines' },
      { icon: Zap, label: 'Instant results' },
    ],
  },
  {
    id: 'scan',
    title: 'Start with Your First Scan',
    subtitle: 'The Foundation of Your Skin Journey',
    description: 'Complete your skin profile and capture a photo. Our AI will analyze your skin condition and identify areas for improvement.',
    icon: ScanFace,
    steps: [
      'Select your skin type (Oily, Dry, Combo, Normal)',
      'Choose your primary skin concerns',
      'Set your environmental factors',
      'Take or upload a clear photo of your face',
    ],
  },
  {
    id: 'progress',
    title: 'Track Your Progress',
    subtitle: 'See Your Skin Transform Over Time',
    description: 'After your first scan, unlock the Progress Timeline. Compare before & after photos and watch your skin health score improve.',
    icon: TrendingUp,
    features: [
      { icon: Camera, label: 'Before/After comparisons' },
      { icon: TrendingUp, label: 'Score trend analysis' },
      { icon: Star, label: 'Visual improvements' },
    ],
  },
  {
    id: 'scanner',
    title: 'Scan Your Products',
    subtitle: 'Find What Works For Your Skin',
    description: 'Use the Product Scanner to check if your skincare products are compatible with your unique skin profile. Avoid harmful ingredients!',
    icon: Camera,
    steps: [
      'Capture a photo of ingredient labels',
      'AI analyzes each ingredient',
      'Get compatibility score & warnings',
      'Find better alternatives',
    ],
  },
  {
    id: 'coach',
    title: 'Your AI Skin Coach',
    subtitle: 'Daily Personalized Guidance',
    description: 'Get daily tips tailored to your skin, weather conditions, and routine. Your AI coach learns from your progress and adapts its recommendations.',
    icon: MessageCircle,
    features: [
      { icon: Droplets, label: 'Routine reminders' },
      { icon: Zap, label: 'Weather-based tips' },
      { icon: Shield, label: 'Personalized advice' },
    ],
  },
];

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const StepIcon = step.icon;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-background/95 backdrop-blur-xl border-primary/20 overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
        
        {/* Progress bar */}
        <div className="px-6 pt-6">
          <Progress value={progress} className="h-1" />
          <p className="text-xs text-muted-foreground mt-2">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 relative">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-scale-in">
              <StepIcon className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>

          {/* Title */}
          <DialogTitle className="text-xl font-bold text-center mb-1">
            {step.title}
          </DialogTitle>
          <DialogDescription className="text-primary text-sm font-medium text-center mb-3">
            {step.subtitle}
          </DialogDescription>

          {/* Description */}
          <p className="text-muted-foreground text-center text-sm mb-4">
            {step.description}
          </p>

          {/* Note (for welcome step) */}
          {'note' in step && step.note && (
            <p className="text-xs text-center text-primary/80 bg-primary/10 rounded-lg px-3 py-2 mb-4">
              {step.note}
            </p>
          )}

          {/* Features or Steps */}
          {step.features && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {step.features.map((feature, idx) => {
                const FeatureIcon = feature.icon;
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/50"
                  >
                    <FeatureIcon className="w-5 h-5 text-primary" />
                    <span className="text-xs text-muted-foreground text-center">
                      {feature.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {step.steps && (
            <div className="space-y-2 mb-4">
              {step.steps.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-primary">{idx + 1}</span>
                  </div>
                  <span className="text-sm text-foreground">{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          {currentStep > 0 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <button
              onClick={handleSkip}
              className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip Tour
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium text-sm btn-shine"
          >
            {isLastStep ? "Let's Go!" : 'Next'}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-1.5 pb-4">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentStep
                  ? 'w-6 bg-primary'
                  : idx < currentStep
                  ? 'bg-primary/50'
                  : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
