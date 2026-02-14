
# UI Color Refinement: From Generic Tech to Premium Skincare

## The Problem
The current color scheme (electric cyan #00F5FF + ultraviolet #7000FF on obsidian black) reads as a gaming/crypto app, not a clinical skincare tool. The heavy neon gradients, glow effects, and saturated colors feel templated and undermine trust.

## The Solution
Shift to a refined, clinical-luxury palette that still feels modern but is grounded in skincare aesthetics. Think high-end dermatology clinic meets modern tech.

### New Color Direction
- **Primary**: Soft teal (180 45% 55%) -- calming, clinical, associated with health/wellness
- **Secondary**: Warm rose-gold (350 40% 65%) -- premium, luxury, skin-toned
- **Background**: Deep charcoal (220 15% 8%) -- keep the dark mode but soften it
- **Accents**: Muted lavender for PRO badges instead of neon purple
- **Text**: Warmer off-white instead of stark blue-white

### What Changes

**1. CSS Variables (src/index.css)**
- Update primary from electric cyan to soft teal
- Update secondary from ultraviolet to warm rose-gold
- Soften the border and muted colors for less harsh contrast
- Tone down the glow/shadow effects (less neon, more subtle luminance)

**2. Glow/Animation Effects (src/index.css)**
- Reduce glow intensity on `.glow-cyan`, `.glow-violet`
- Soften text-glow effects
- Make pulse animations subtler
- Keep glassmorphism but with warmer tint

**3. Landing Page (src/components/skin/SkynLanding.tsx)**
- Hero gradient shifts from cyan/purple radials to teal/rose soft radials
- "New Scan" button uses refined gradient instead of neon stripe
- Feature cards use softer accent backgrounds
- PRO badges use muted lavender instead of electric purple

**4. Bottom Navigation (src/components/skin/BottomNav.tsx)**
- Active state uses new teal primary instead of cyan glow

**5. Premium components (PremiumBanner, PremiumUpgradeModal)**
- CTA buttons use the new teal-to-rose gradient
- Crown/PRO styling uses rose-gold accent

**6. Tailwind config (tailwind.config.ts)**
- Update custom color references to match new palette

### What Stays the Same
- Overall dark mode aesthetic (just warmer)
- Layout and component structure
- Glassmorphism card style (just warmer tones)
- All functionality and features

## Technical Details

### New CSS Variable Values
```text
--primary:        180 45% 55%    (soft teal)
--secondary:      350 40% 65%    (rose-gold)
--accent:         260 30% 55%    (muted lavender)
--muted:          220 12% 16%    (warmer dark)
--border:         220 12% 20%    (softer borders)
--ring:           180 45% 55%    (matches primary)
--electric-cyan replaced with --teal: 180 45% 55%
--ultraviolet replaced with --rose: 350 40% 65%
```

### Files to Edit
1. `src/index.css` -- color variables + effect classes
2. `tailwind.config.ts` -- custom color names
3. `src/components/skin/SkynLanding.tsx` -- gradient references
4. `src/components/skin/BottomNav.tsx` -- active state colors
5. `src/components/premium/PremiumBanner.tsx` -- accent colors
6. `src/components/premium/PremiumUpgradeModal.tsx` -- CTA gradient
7. Any other components using `cyan-electric`, `violet-ultra`, or hardcoded HSL values
