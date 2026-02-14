import { useState } from 'react';
import { Droplet, Sun, Wind, AlertTriangle, Clock, DollarSign, Lock, Crown, Zap, Wand2 } from 'lucide-react';

interface SkinFormData {
  skinType: string;
  concerns: string[];
  climate: string;
  pollution: string;
  budget: string;
  analysisTier: 'basic' | 'advanced' | 'premium';
}

interface SkinFormProps {
  onSubmit: (data: SkinFormData) => void;
  isValid: boolean;
  isPremium?: boolean;
  onUpgradeClick?: () => void;
}

const skinTypes = [
  { id: 'oily', label: 'Oily', icon: Droplet },
  { id: 'dry', label: 'Dry', icon: Sun },
  { id: 'combo', label: 'Combination', icon: Wind },
  { id: 'sensitive', label: 'Sensitive', icon: AlertTriangle },
];

const concerns = [
  { id: 'acne', label: 'Acne' },
  { id: 'aging', label: 'Aging' },
  { id: 'hyperpigmentation', label: 'Hyperpigmentation' },
  { id: 'texture', label: 'Texture' },
  { id: 'redness', label: 'Redness' },
  { id: 'dullness', label: 'Dullness' },
];

const climates = [
  { id: 'humid', label: 'Humid' },
  { id: 'dry', label: 'Dry' },
  { id: 'temperate', label: 'Temperate' },
  { id: 'tropical', label: 'Tropical' },
];

const pollutionLevels = [
  { id: 'low', label: 'Low' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'high', label: 'High' },
];

const budgetLevels = [
  { id: 'budget', label: '💰 Budget', description: 'Drugstore & affordable' },
  { id: 'mid', label: '💎 Mid-Range', description: 'Quality brands' },
  { id: 'luxury', label: '👑 Luxury', description: 'Premium products' },
];

const analysisTiers = [
  { id: 'basic', label: 'Basic', icon: Zap, description: '3-4 steps', locked: false },
  { id: 'advanced', label: 'Advanced', icon: Wand2, description: '4-5 steps', locked: false },
  { id: 'premium', label: 'Premium', icon: Crown, description: 'Full routine + deep analysis', locked: true },
];

export function SkinForm({ onSubmit, isValid, isPremium = false, onUpgradeClick }: SkinFormProps) {
  const [formData, setFormData] = useState<SkinFormData>({
    skinType: '',
    concerns: [],
    climate: '',
    pollution: '',
    budget: '',
    analysisTier: 'basic',
  });

  const handleSkinTypeSelect = (type: string) => {
    const newData = { ...formData, skinType: type };
    setFormData(newData);
    onSubmit(newData);
  };

  const handleConcernToggle = (concern: string) => {
    const newConcerns = formData.concerns.includes(concern)
      ? formData.concerns.filter(c => c !== concern)
      : [...formData.concerns, concern];
    const newData = { ...formData, concerns: newConcerns };
    setFormData(newData);
    onSubmit(newData);
  };

  const handleClimateSelect = (climate: string) => {
    const newData = { ...formData, climate };
    setFormData(newData);
    onSubmit(newData);
  };

  const handlePollutionSelect = (level: string) => {
    const newData = { ...formData, pollution: level };
    setFormData(newData);
    onSubmit(newData);
  };

  const handleBudgetSelect = (budget: string) => {
    const newData = { ...formData, budget };
    setFormData(newData);
    onSubmit(newData);
  };

  const handleTierSelect = (tier: 'basic' | 'advanced' | 'premium') => {
    if (tier === 'premium' && !isPremium) {
      onUpgradeClick?.();
      return;
    }
    const newData = { ...formData, analysisTier: tier };
    setFormData(newData);
    onSubmit(newData);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Skin Type */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
          <Droplet className="w-4 h-4 text-primary" />
          Skin Type
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {skinTypes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleSkinTypeSelect(id)}
              className={`p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 ${
                formData.skinType === id
                  ? 'border-primary bg-primary/10 glow-cyan'
                  : 'border-border bg-muted/30 hover:border-primary/50'
              }`}
            >
              <Icon className={`w-5 h-5 ${formData.skinType === id ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${formData.skinType === id ? 'text-primary' : 'text-foreground'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Concerns */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-secondary" />
          Primary Concerns
        </h3>
        <div className="flex flex-wrap gap-2">
          {concerns.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleConcernToggle(id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                formData.concerns.includes(id)
                  ? 'bg-secondary text-secondary-foreground glow-violet'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Product Budget
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {budgetLevels.map(({ id, label, description }) => (
            <button
              key={id}
              onClick={() => handleBudgetSelect(id)}
              className={`p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-1 ${
                formData.budget === id
                  ? 'border-primary bg-primary/10 glow-cyan'
                  : 'border-border bg-muted/30 hover:border-primary/50'
              }`}
            >
              <span className={`text-xs font-medium ${formData.budget === id ? 'text-primary' : 'text-foreground'}`}>
                {label}
              </span>
              <span className="text-[10px] text-muted-foreground text-center">{description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Tier */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-secondary" />
          Analysis Depth
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {analysisTiers.map(({ id, label, icon: Icon, description, locked }) => {
            const isLocked = locked && !isPremium;
            return (
              <button
                key={id}
                onClick={() => handleTierSelect(id as 'basic' | 'advanced' | 'premium')}
                className={`p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-1 relative ${
                  formData.analysisTier === id && !isLocked
                    ? 'border-secondary bg-secondary/10 glow-violet'
                    : isLocked
                    ? 'border-border bg-muted/20 opacity-75'
                    : 'border-border bg-muted/30 hover:border-secondary/50'
                }`}
              >
                {isLocked && (
                  <div className="absolute top-1 right-1">
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
                <Icon className={`w-4 h-4 ${
                  formData.analysisTier === id && !isLocked 
                    ? 'text-secondary' 
                    : isLocked 
                    ? 'text-muted-foreground' 
                    : 'text-foreground'
                }`} />
                <span className={`text-xs font-medium ${
                  formData.analysisTier === id && !isLocked 
                    ? 'text-secondary' 
                    : isLocked 
                    ? 'text-muted-foreground' 
                    : 'text-foreground'
                }`}>
                  {label}
                </span>
                <span className="text-[10px] text-muted-foreground text-center">{description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Environmental Factors */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
          <Wind className="w-4 h-4 text-primary" />
          Environmental Factors
        </h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Climate</p>
            <div className="flex flex-wrap gap-2">
              {climates.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => handleClimateSelect(id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                    formData.climate === id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-2">Pollution Level</p>
            <div className="flex flex-wrap gap-2">
              {pollutionLevels.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => handlePollutionSelect(id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                    formData.pollution === id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!isValid && (
        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" />
          Complete the form above to unlock analysis
        </p>
      )}
    </div>
  );
}
