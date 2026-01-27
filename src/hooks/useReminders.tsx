import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface ReminderSettings {
  enabled: boolean;
  amTime: string; // HH:MM format
  pmTime: string; // HH:MM format
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  amTime: '07:00',
  pmTime: '21:00',
};

export function useReminders() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  // Load settings from localStorage
  useEffect(() => {
    const storageKey = user ? `reminders_${user.id}` : 'reminders_guest';
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }
  }, [user]);

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const saveSettings = useCallback((newSettings: ReminderSettings) => {
    const storageKey = user ? `reminders_${user.id}` : 'reminders_guest';
    localStorage.setItem(storageKey, JSON.stringify(newSettings));
    setSettings(newSettings);
  }, [user]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermissionStatus('granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      setPermissionStatus('denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    return permission === 'granted';
  }, []);

  const enableReminders = useCallback(async (amTime: string, pmTime: string): Promise<boolean> => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      return false;
    }

    const newSettings: ReminderSettings = {
      enabled: true,
      amTime,
      pmTime,
    };

    saveSettings(newSettings);
    scheduleReminders(newSettings);
    return true;
  }, [requestPermission, saveSettings]);

  const disableReminders = useCallback(() => {
    const newSettings: ReminderSettings = {
      ...settings,
      enabled: false,
    };
    saveSettings(newSettings);
    
    // Clear any scheduled notifications via service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_REMINDERS',
      });
    }
  }, [settings, saveSettings]);

  const updateTimes = useCallback((amTime: string, pmTime: string) => {
    const newSettings: ReminderSettings = {
      ...settings,
      amTime,
      pmTime,
    };
    saveSettings(newSettings);
    
    if (settings.enabled) {
      scheduleReminders(newSettings);
    }
  }, [settings, saveSettings]);

  const scheduleReminders = (reminderSettings: ReminderSettings) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_REMINDERS',
        payload: reminderSettings,
      });
    }
  };

  const testNotification = useCallback(async (type: 'AM' | 'PM') => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      return false;
    }

    const title = type === 'AM' ? '☀️ Morning Skincare' : '🌙 Evening Skincare';
    const body = type === 'AM' 
      ? 'Time for your morning skincare routine! Start your day with glowing skin.'
      : 'Time for your evening skincare routine! Prepare your skin for overnight repair.';

    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `skincare-${type.toLowerCase()}`,
      requireInteraction: false,
    });

    return true;
  }, [requestPermission]);

  return {
    settings,
    permissionStatus,
    isSupported: 'Notification' in window,
    enableReminders,
    disableReminders,
    updateTimes,
    requestPermission,
    testNotification,
  };
}
