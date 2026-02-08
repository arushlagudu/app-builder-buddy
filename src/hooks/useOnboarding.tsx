import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

const ONBOARDING_KEY = 'derma-onboarding-completed';

export function useOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true); // Default to true to avoid flash
  const [isLoading, setIsLoading] = useState(true);
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    const checkOnboarding = () => {
      // If user is NOT logged in, show onboarding
      if (!user) {
        // Check if they've seen it as a guest
        const guestCompleted = localStorage.getItem(ONBOARDING_KEY);
        setHasSeenOnboarding(guestCompleted === 'true');
        setIsLoading(false);
        return;
      }

      // If user IS logged in, check if this is their first time
      const userKey = `${ONBOARDING_KEY}-${user.id}`;
      const completed = localStorage.getItem(userKey);
      
      // If switching from no user to a new user (first login ever for this account)
      // and they haven't completed onboarding for this user ID, show it
      if (previousUserIdRef.current !== user.id) {
        previousUserIdRef.current = user.id;
        
        // Only show onboarding if they haven't completed it for this specific user
        if (completed !== 'true') {
          setHasSeenOnboarding(false);
        } else {
          setHasSeenOnboarding(true);
        }
      } else {
        setHasSeenOnboarding(completed === 'true');
      }
      
      setIsLoading(false);
    };

    checkOnboarding();
  }, [user, authLoading]);

  const completeOnboarding = () => {
    if (user) {
      localStorage.setItem(`${ONBOARDING_KEY}-${user.id}`, 'true');
    } else {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    }
    setHasSeenOnboarding(true);
  };

  const resetOnboarding = () => {
    if (user) {
      localStorage.removeItem(`${ONBOARDING_KEY}-${user.id}`);
    } else {
      localStorage.removeItem(ONBOARDING_KEY);
    }
    setHasSeenOnboarding(false);
  };

  return {
    hasSeenOnboarding,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
}
