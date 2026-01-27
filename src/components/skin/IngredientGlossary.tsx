import { useState } from 'react';
import { X, FlaskConical, AlertTriangle, Star, Leaf, Droplet, Shield, Sun, Zap } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface IngredientGlossaryProps {
  ingredient: {
    name: string;
    reason: string;
    type: 'avoid' | 'prescription';
  } | null;
  open: boolean;
  onClose: () => void;
}

interface IngredientInfo {
  category: string;
  function: string;
  howItWorks: string;
  skinChemistry: string;
  icon: typeof FlaskConical;
  safetyLevel?: 'gentle' | 'moderate' | 'potent';
}

const ingredientDatabase: Record<string, IngredientInfo> = {
  // Common beneficial ingredients
  'niacinamide': {
    category: 'Vitamin B3 Derivative',
    function: 'Brightening, Pore Minimizing, Barrier Support',
    howItWorks: 'Boosts ceramide production and regulates sebum. Inhibits melanosome transfer to reduce hyperpigmentation.',
    skinChemistry: 'Water-soluble vitamin that penetrates easily. Works at pH 5-7. Pairs well with most actives except Vitamin C at high concentrations.',
    icon: Star,
    safetyLevel: 'gentle'
  },
  'hyaluronic acid': {
    category: 'Humectant / Glycosaminoglycan',
    function: 'Deep Hydration, Plumping',
    howItWorks: 'Draws water from the environment and deeper skin layers. Can hold 1000x its weight in water.',
    skinChemistry: 'Naturally occurring in skin. Different molecular weights penetrate to different depths. Low MW (< 50 kDa) reaches deeper layers.',
    icon: Droplet,
    safetyLevel: 'gentle'
  },
  'retinol': {
    category: 'Vitamin A Derivative',
    function: 'Anti-Aging, Cell Turnover, Acne Treatment',
    howItWorks: 'Converts to retinoic acid in skin. Accelerates cell turnover and boosts collagen synthesis.',
    skinChemistry: 'Fat-soluble, requires conversion by skin enzymes. Degrades in light/air. Use at night. Start low (0.25%) and build tolerance.',
    icon: Zap,
    safetyLevel: 'potent'
  },
  'salicylic acid': {
    category: 'Beta Hydroxy Acid (BHA)',
    function: 'Exfoliation, Pore Clearing, Anti-Inflammatory',
    howItWorks: 'Oil-soluble so it penetrates into pores. Dissolves the bonds between dead skin cells and reduces sebum.',
    skinChemistry: 'Effective at pH 3-4. Derived from willow bark. Anti-inflammatory properties from aspirin relation.',
    icon: FlaskConical,
    safetyLevel: 'moderate'
  },
  'vitamin c': {
    category: 'Antioxidant / L-Ascorbic Acid',
    function: 'Brightening, Antioxidant Protection, Collagen Boost',
    howItWorks: 'Neutralizes free radicals, inhibits tyrosinase to reduce melanin production, and is essential for collagen synthesis.',
    skinChemistry: 'Most effective as L-Ascorbic Acid at pH < 3.5. Unstable - oxidizes easily. Store in dark, cool place. Derivatives (MAP, SAP) are more stable but less potent.',
    icon: Sun,
    safetyLevel: 'moderate'
  },
  'ceramides': {
    category: 'Lipid / Skin-Identical Ingredient',
    function: 'Barrier Repair, Moisture Retention',
    howItWorks: 'Fills gaps between skin cells in the stratum corneum, creating a water-tight barrier.',
    skinChemistry: 'Make up 50% of skin lipid barrier. Work best with cholesterol and fatty acids in 3:1:1 ratio.',
    icon: Shield,
    safetyLevel: 'gentle'
  },
  'glycolic acid': {
    category: 'Alpha Hydroxy Acid (AHA)',
    function: 'Exfoliation, Brightening, Texture Refinement',
    howItWorks: 'Smallest AHA molecule - penetrates deeply. Breaks bonds between dead skin cells for faster turnover.',
    skinChemistry: 'Effective at pH 3-4. Water-soluble. Can increase sun sensitivity. Derived from sugarcane.',
    icon: FlaskConical,
    safetyLevel: 'moderate'
  },
  'peptides': {
    category: 'Amino Acid Chains',
    function: 'Collagen Support, Firming, Signal Transmission',
    howItWorks: 'Short chains of amino acids that signal skin to produce more collagen and elastin.',
    skinChemistry: 'Different peptides have different functions. Copper peptides for healing, Matrixyl for collagen, Argireline for expression lines.',
    icon: Star,
    safetyLevel: 'gentle'
  },
  'benzoyl peroxide': {
    category: 'Antibacterial / Oxidizing Agent',
    function: 'Acne Treatment, Bacteria Elimination',
    howItWorks: 'Releases oxygen into pores, killing P. acnes bacteria. Also has mild exfoliating effect.',
    skinChemistry: 'Available in 2.5-10% concentrations. 2.5% often as effective as higher with less irritation. Can bleach fabrics.',
    icon: Zap,
    safetyLevel: 'potent'
  },
  'azelaic acid': {
    category: 'Dicarboxylic Acid',
    function: 'Brightening, Anti-Acne, Anti-Rosacea',
    howItWorks: 'Inhibits tyrosinase and kills acne bacteria. Anti-inflammatory properties help with rosacea.',
    skinChemistry: 'Naturally produced by yeast on skin. Gentle enough for sensitive skin. Works well at 10-20%.',
    icon: Leaf,
    safetyLevel: 'gentle'
  },
  // Common ingredients to avoid
  'alcohol denat': {
    category: 'Drying Solvent',
    function: 'Quick-Dry Agent, Preservative',
    howItWorks: 'Evaporates quickly, giving products a lightweight feel. Can strip natural oils and damage skin barrier.',
    skinChemistry: 'Denatured alcohol disrupts lipid barrier. Causes TEWL (transepidermal water loss). Some fatty alcohols (cetyl, cetearyl) are beneficial.',
    icon: AlertTriangle,
    safetyLevel: 'potent'
  },
  'fragrance': {
    category: 'Sensory Additive',
    function: 'Scent, Marketing Appeal',
    howItWorks: 'Provides pleasant scent but serves no skincare function. Can contain dozens of undisclosed sensitizing compounds.',
    skinChemistry: 'Top allergen in skincare. "Parfum" can hide 3000+ possible ingredients. Even "natural" fragrance can sensitize.',
    icon: AlertTriangle,
    safetyLevel: 'potent'
  },
  'sodium lauryl sulfate': {
    category: 'Surfactant / Cleanser',
    function: 'Foaming, Deep Cleansing',
    howItWorks: 'Creates foam and removes oil effectively but strips too much, damaging the skin barrier.',
    skinChemistry: 'Very small molecule penetrates easily. Can denature proteins. SLES (Sodium Laureth Sulfate) is slightly gentler.',
    icon: AlertTriangle,
    safetyLevel: 'potent'
  },
  'essential oils': {
    category: 'Volatile Plant Extracts',
    function: 'Fragrance, Antibacterial',
    howItWorks: 'Concentrated plant extracts that can have antimicrobial properties but are highly sensitizing.',
    skinChemistry: 'Contain volatile compounds that cause oxidative stress. Lavender, tea tree, citrus oils are common irritants.',
    icon: Leaf,
    safetyLevel: 'moderate'
  },
};

const getIngredientInfo = (name: string): IngredientInfo => {
  const normalizedName = name.toLowerCase();
  
  // Check for exact or partial matches
  for (const [key, info] of Object.entries(ingredientDatabase)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return info;
    }
  }
  
  // Default for unknown ingredients
  return {
    category: 'Skincare Ingredient',
    function: 'Various skincare benefits',
    howItWorks: 'This ingredient works through specific mechanisms based on its chemical structure.',
    skinChemistry: 'Consult with a dermatologist for detailed information about this specific ingredient.',
    icon: FlaskConical,
    safetyLevel: 'moderate'
  };
};

const getSafetyColor = (level?: 'gentle' | 'moderate' | 'potent') => {
  switch (level) {
    case 'gentle': return 'text-green-400 bg-green-400/20';
    case 'moderate': return 'text-yellow-400 bg-yellow-400/20';
    case 'potent': return 'text-orange-400 bg-orange-400/20';
    default: return 'text-muted-foreground bg-muted/20';
  }
};

export function IngredientGlossary({ ingredient, open, onClose }: IngredientGlossaryProps) {
  if (!ingredient) return null;

  const info = getIngredientInfo(ingredient.name);
  const Icon = info.icon;
  const isAvoid = ingredient.type === 'avoid';

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-background border-primary/20">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isAvoid ? 'bg-destructive/20' : 'bg-primary/20'
              }`}>
                <Icon className={`w-6 h-6 ${isAvoid ? 'text-destructive' : 'text-primary'}`} />
              </div>
              <div>
                <SheetTitle className="text-left text-lg">{ingredient.name}</SheetTitle>
                <p className="text-xs text-muted-foreground">{info.category}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isAvoid 
                ? 'bg-destructive/20 text-destructive' 
                : 'bg-primary/20 text-primary'
            }`}>
              {isAvoid ? 'Avoid' : 'Recommended'}
            </span>
          </div>
        </SheetHeader>

        <div className="space-y-5 overflow-y-auto pb-8">
          {/* Why for you */}
          <div className="glass-card p-4">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-secondary" />
              Why This Matters For You
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {ingredient.reason}
            </p>
          </div>

          {/* Function */}
          <div className="glass-card p-4">
            <h4 className="text-sm font-semibold mb-2">Primary Functions</h4>
            <div className="flex flex-wrap gap-2">
              {info.function.split(', ').map((func, i) => (
                <span 
                  key={i}
                  className="px-3 py-1 rounded-full text-xs bg-secondary/20 text-secondary"
                >
                  {func}
                </span>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="glass-card p-4">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-primary" />
              How It Works
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {info.howItWorks}
            </p>
          </div>

          {/* Skin Chemistry */}
          <div className="glass-card p-4 border-primary/30">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              🧬 Skin Chemistry
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {info.skinChemistry}
            </p>
          </div>

          {/* Safety Level */}
          <div className="glass-card p-4">
            <h4 className="text-sm font-semibold mb-3">Potency Level</h4>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-xl text-sm font-medium ${getSafetyColor(info.safetyLevel)}`}>
                {info.safetyLevel === 'gentle' && '🌿 Gentle'}
                {info.safetyLevel === 'moderate' && '⚡ Moderate'}
                {info.safetyLevel === 'potent' && '🔥 Potent'}
              </span>
              <p className="text-xs text-muted-foreground">
                {info.safetyLevel === 'gentle' && 'Safe for daily use, minimal irritation risk'}
                {info.safetyLevel === 'moderate' && 'May need gradual introduction'}
                {info.safetyLevel === 'potent' && 'Start low, build tolerance slowly'}
              </p>
            </div>
          </div>

          {/* Pro Tip */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-4 border border-primary/20">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              💡 Dermatologist Tip
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isAvoid 
                ? `Always check ingredient labels for "${ingredient.name}" and its derivatives. Even small amounts can affect sensitive skin over time.`
                : `For best results with ${ingredient.name}, introduce it gradually and monitor your skin's response for 2-4 weeks before increasing frequency.`
              }
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
