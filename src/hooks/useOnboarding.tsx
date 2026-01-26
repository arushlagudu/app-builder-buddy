import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const ONBOARDING_KEY = 'derma-onboarding-completed';

export function useOnboarding() {
  const { user } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true); // Default to true to avoid flash
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for onboarding status
    const checkOnboarding = () => {
      const storageKey = user ? `${ONBOARDING_KEY}-${user.id}` : ONBOARDING_KEY;
      const completed = localStorage.getItem(storageKey);
      setHasSeenOnboarding(completed === 'true');
      setIsLoading(false);
    };

    checkOnboarding();
  }, [user]);

  const completeOnboarding = () => {
    const storageKey = user ? `${ONBOARDING_KEY}-${user.id}` : ONBOARDING_KEY;
    localStorage.setItem(storageKey, 'true');
    setHasSeenOnboarding(true);
  };

  const resetOnboarding = () => {
    const storageKey = user ? `${ONBOARDING_KEY}-${user.id}` : ONBOARDING_KEY;
    localStorage.removeItem(storageKey);
    setHasSeenOnboarding(false);
  };

  return {
    hasSeenOnboarding,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
}
