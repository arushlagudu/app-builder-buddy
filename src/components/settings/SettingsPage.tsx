import { useState } from 'react';
import { User, Bell, Palette, HelpCircle, LogOut, ChevronRight, Shield, FileText, RotateCcw, Trash2, Gem, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { ProfileSettings } from './ProfileSettings';
import { ReminderSettings } from './ReminderSettings';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type SettingsSection = 'main' | 'profile' | 'reminders';

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function SettingsItem({ icon, label, description, onClick, rightElement, danger }: SettingsItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
        danger 
          ? 'hover:bg-destructive/10 text-destructive' 
          : 'hover:bg-muted/50'
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        danger ? 'bg-destructive/20' : 'bg-muted/50'
      }`}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {rightElement || (onClick && <ChevronRight className="w-5 h-5 text-muted-foreground" />)}
    </button>
  );
}

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { isPremium } = useSubscription();
  const [section, setSection] = useState<SettingsSection>('main');
  const [darkMode, setDarkMode] = useState(true);

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      toast.error('Unable to open subscription management. Please try again.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  const handleReplayTutorial = () => {
    localStorage.removeItem('onboarding_completed');
    window.location.reload();
  };

  const handleDeleteAccount = () => {
    toast.error('Contact support to delete your account', {
      description: 'This action cannot be undone',
    });
  };

  if (section === 'profile') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSection('main')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Settings
        </button>
        <ProfileSettings />
      </div>
    );
  }

  if (section === 'reminders') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSection('main')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Settings
        </button>
        <ReminderSettings />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="glass-card p-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl mb-3">
          {user?.user_metadata?.display_name?.[0]?.toUpperCase() || '👤'}
        </div>
        <h2 className="text-xl font-semibold">{user?.user_metadata?.display_name || 'User'}</h2>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      {/* Account Section */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</h3>
        </div>
        <SettingsItem
          icon={<User className="w-5 h-5" />}
          label="Profile"
          description="Edit your display name"
          onClick={() => setSection('profile')}
        />
        <SettingsItem
          icon={<Bell className="w-5 h-5" />}
          label="Reminders"
          description="AM/PM routine notifications"
          onClick={() => setSection('reminders')}
        />
        {isPremium && (
          <SettingsItem
            icon={<CreditCard className="w-5 h-5" />}
            label="Manage Subscription"
            description="Billing, cancel, or change plan"
            onClick={handleManageSubscription}
          />
        )}
      </div>

      {/* Appearance Section */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Appearance</h3>
        </div>
        <SettingsItem
          icon={<Palette className="w-5 h-5" />}
          label="Dark Mode"
          description="Use dark theme"
          rightElement={
            <Switch
              checked={darkMode}
              onCheckedChange={(checked) => {
                setDarkMode(checked);
                toast.info(checked ? 'Dark mode enabled' : 'Light mode not yet available');
              }}
            />
          }
        />
      </div>

      {/* Help & Support Section */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Help & Support</h3>
        </div>
        <SettingsItem
          icon={<RotateCcw className="w-5 h-5" />}
          label="Replay Tutorial"
          description="View the onboarding guide again"
          onClick={handleReplayTutorial}
        />
        <SettingsItem
          icon={<HelpCircle className="w-5 h-5" />}
          label="Help Center"
          description="FAQs and support"
          onClick={() => toast.info('Help center coming soon!')}
        />
      </div>

      {/* Legal Section */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Legal</h3>
        </div>
        <SettingsItem
          icon={<Shield className="w-5 h-5" />}
          label="Privacy Policy"
          onClick={() => toast.info('Privacy policy coming soon!')}
        />
        <SettingsItem
          icon={<FileText className="w-5 h-5" />}
          label="Terms of Service"
          onClick={() => toast.info('Terms of service coming soon!')}
        />
      </div>

      {/* Danger Zone */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-xs font-semibold text-destructive uppercase tracking-wider">Danger Zone</h3>
        </div>
        <SettingsItem
          icon={<LogOut className="w-5 h-5" />}
          label="Sign Out"
          onClick={handleSignOut}
          danger
        />
        <SettingsItem
          icon={<Trash2 className="w-5 h-5" />}
          label="Delete Account"
          description="Permanently delete your account"
          onClick={handleDeleteAccount}
          danger
        />
      </div>

      {/* App Version */}
      <div className="text-center text-xs text-muted-foreground py-4">
        <p>GlowUp v1.0.0</p>
        <p>Made with 💜 for your skin</p>
      </div>
    </div>
  );
}
