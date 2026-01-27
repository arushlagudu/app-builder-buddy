import { useState } from 'react';
import { Bell, BellOff, Clock, Sun, Moon, AlertCircle, CheckCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useReminders } from '@/hooks/useReminders';
import { toast } from 'sonner';

export function ReminderSettings() {
  const {
    settings,
    permissionStatus,
    isSupported,
    enableReminders,
    disableReminders,
    updateTimes,
    testNotification,
  } = useReminders();

  const [amTime, setAmTime] = useState(settings.amTime);
  const [pmTime, setPmTime] = useState(settings.pmTime);
  const [isEnabling, setIsEnabling] = useState(false);

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      setIsEnabling(true);
      const success = await enableReminders(amTime, pmTime);
      setIsEnabling(false);
      
      if (success) {
        toast.success('Reminders enabled! You\'ll get daily notifications.');
      } else {
        toast.error('Please allow notifications to enable reminders.');
      }
    } else {
      disableReminders();
      toast.info('Reminders disabled.');
    }
  };

  const handleTimeChange = (type: 'AM' | 'PM', value: string) => {
    if (type === 'AM') {
      setAmTime(value);
    } else {
      setPmTime(value);
    }
    
    if (settings.enabled) {
      updateTimes(type === 'AM' ? value : amTime, type === 'PM' ? value : pmTime);
    }
  };

  const handleTestNotification = async (type: 'AM' | 'PM') => {
    const success = await testNotification(type);
    if (!success) {
      toast.error('Please allow notifications first.');
    }
  };

  if (!isSupported) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">Notifications Not Supported</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your browser doesn't support notifications. Try using a modern browser like Chrome, Firefox, or Safari.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {settings.enabled ? (
            <Bell className="w-5 h-5 text-primary" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <h3 className="font-semibold">Routine Reminders</h3>
            <p className="text-sm text-muted-foreground">
              Get notified for your AM/PM skincare
            </p>
          </div>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={handleToggle}
          disabled={isEnabling}
        />
      </div>

      {permissionStatus === 'denied' && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-sm">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        </div>
      )}

      {permissionStatus === 'granted' && settings.enabled && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 text-primary">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-sm">
            Reminders are active! You'll receive daily notifications.
          </p>
        </div>
      )}

      <div className="space-y-4 pt-2">
        {/* AM Reminder */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Sun className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Morning Routine</p>
              <p className="text-xs text-muted-foreground">Cleanser, serum, sunscreen</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={amTime}
              onChange={(e) => handleTimeChange('AM', e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={() => handleTestNotification('AM')}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Test notification"
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* PM Reminder */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
              <Moon className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="font-medium">Evening Routine</p>
              <p className="text-xs text-muted-foreground">Double cleanse, treatments, moisturizer</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={pmTime}
              onChange={(e) => handleTimeChange('PM', e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
            />
            <button
              onClick={() => handleTestNotification('PM')}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Test notification"
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" />
          Notifications will appear at your set times daily
        </p>
      </div>
    </div>
  );
}
