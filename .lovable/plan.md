

# Retention and Profit Maximization Plan

## The Problem
Users scan once, get results, and have no compelling reason to return daily. The app lacks re-engagement loops, urgency triggers, and "sticky" habits that keep users opening the app.

## Strategy Overview

We'll implement 5 high-impact changes across 3 categories: **Hook**, **Habit**, and **Convert**.

---

## 1. Auto-Funnel: Onboarding to First Scan (Hook)

**Problem**: After onboarding, users land on the SKYN landing page and must manually navigate to Scan. Many will drop off.

**Fix**: When a new user finishes the onboarding tutorial, automatically navigate them to the Scan tab with a "First Scan FREE" badge on the scan button. After they complete their first scan and see results, auto-show the Premium modal with a "Your results are ready -- unlock your full routine" message.

**Changes**:
- `OnboardingModal`: Add a final step with a direct "Start My First Scan" CTA
- `Index.tsx`: On `handleCompleteOnboarding`, auto-set `activeTab` to `'scan'`
- `ImageCapture` / scan button: Show a pulsing "First Scan FREE" badge for users with 0 scans
- After first analysis completes, trigger `PremiumUpgradeModal` with a new `first_results` trigger after a 3-second delay

---

## 2. 7-Day Free Trial for Premium (Convert)

**Problem**: Users hit the paywall immediately for features like Progress, Product Scanner, and History. No way to experience value before paying.

**Fix**: Offer a 7-day free trial on the Stripe subscription. Users get full premium access for a week, then auto-convert to paid.

**Changes**:
- `create-checkout` edge function: Add `subscription_data: { trial_period_days: 7 }` to the Stripe session
- `PremiumUpgradeModal`: Update CTA text to "Start 7-Day Free Trial" and add "No charge for 7 days" trust copy
- `check-subscription` edge function: Handle `trialing` status as premium
- `useSubscription`: Treat `trialing` status as `isPremium = true`

---

## 3. Daily Skin Tip Push + "Tip of the Day" Card on Landing (Habit)

**Problem**: There's no reason to open the app daily. The streak system exists but users must remember to come back.

**Fix**: Add a "Tip of the Day" card to the SKYN landing page that shows a personalized skin tip based on their latest analysis. This gives users a reason to open the app every day and drives them toward the AI Coach (premium upsell for deeper answers).

**Changes**:
- `SkynLanding.tsx`: Add a "Today's Tip" card above the features grid that fetches/generates a daily tip using the existing `daily_tips` table
- Create a new `generate-daily-tip` edge function that generates a short personalized tip based on the user's skin profile (uses Lovable AI, no API key needed)
- The tip card includes a "Ask the AI Coach for more" CTA that navigates to the Coach tab (premium gate drives conversion)
- For users without a scan: show a generic skincare tip with "Get personalized tips -- complete your first scan" CTA

---

## 4. Score Drop Re-engagement + "Skin Weather" Alert (Hook)

**Problem**: Users who improve feel done; users who worsen don't know it.

**Fix**: On the landing page, show a dynamic "Skin Status" card that compares their latest score with their previous one. If the score dropped, show an urgent "Your skin score dropped" alert with a CTA to re-scan. If it improved, show celebration + "Keep it up -- scan again to maintain your progress." Also show a "time since last scan" counter that creates urgency after 14+ days.

**Changes**:
- `SkynLanding.tsx`: Add a "Skin Status" card for logged-in users with completed scans that shows:
  - Current score with delta arrow (up/down)
  - Days since last scan with color-coded urgency (green < 14 days, yellow 14-30, red 30+)
  - Dynamic CTA: "Re-scan to update" (if stale) or "Looking good!" (if recent)
- Uses the existing `useLatestAnalysis` hook data

---

## 5. Make Premium Card Clickable + Landing Page Upsell Points (Convert)

**Problem**: The Premium Spotlight card on the landing page is purely informational -- it doesn't open the upgrade modal. Missed conversion opportunity.

**Fix**: Make the Premium card clickable to open the upgrade modal. Add social proof and scarcity.

**Changes**:
- `SkynLanding.tsx`: Add `onClick` to the Premium Spotlight card that opens the premium modal
- Pass `onUpgrade` callback prop to `SkynLanding`
- Add "Join 10,000+ users" social proof text
- Add "Limited time: 33% off annual plan" urgency badge

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/components/onboarding/OnboardingModal.tsx` | Add final scan CTA step |
| `src/pages/Index.tsx` | Auto-navigate to scan after onboarding, post-scan premium trigger, pass onUpgrade to landing |
| `src/components/skin/SkynLanding.tsx` | Add Tip of Day card, Skin Status card, clickable premium card, social proof |
| `src/components/premium/PremiumUpgradeModal.tsx` | Add trial copy, "first_results" trigger message |
| `supabase/functions/create-checkout/index.ts` | Add 7-day trial to Stripe session |
| `supabase/functions/check-subscription/index.ts` | Handle trialing status |
| `src/hooks/useSubscription.tsx` | Treat trialing as premium |
| `supabase/functions/generate-daily-tip/index.ts` | New edge function for personalized daily tips |

All AI features use Lovable AI (no external API keys needed). No new database tables required -- the existing `daily_tips` table and `analysis_history` table cover all data needs.

