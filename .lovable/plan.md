

# Replace Crown Icon with Gem Across the App

## Summary
Swap every instance of the `Crown` icon (used for PRO/Premium indicators) with the `Gem` icon from lucide-react. This affects 8 files across the app.

## Files to Update

**1. `src/pages/Index.tsx`** -- PRO badge in the header

**2. `src/components/premium/PremiumBanner.tsx`** -- "Upgrade to Premium" header icon

**3. `src/components/premium/PremiumUpgradeModal.tsx`** -- Hero icon, CTA button icon

**4. `src/components/skin/FirstScanRequired.tsx`** -- Premium feature icon + badge

**5. `src/components/skin/SkynLanding.tsx`** -- Any PRO references on the landing page

**6. `src/components/settings/SettingsPage.tsx`** -- Settings premium section

**7. `src/components/skin/SkinForm.tsx`** -- "Premium" routine tier icon

**8. `src/components/skin/AnalysisResults.tsx`** -- Premium upsell card icon

## What Changes Per File
- Replace `Crown` with `Gem` in the lucide-react import statement
- Replace all `<Crown ... />` JSX usages with `<Gem ... />`
- No layout, sizing, or color changes needed -- just the icon swap

## What Stays the Same
- All icon sizes, colors, and positioning remain identical
- All premium/PRO logic and gating unchanged
- No new dependencies needed (`Gem` is already in lucide-react)

