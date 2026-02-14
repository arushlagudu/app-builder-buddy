
# SKYN App: Revenue Optimization Roadmap

## The Big Picture

You've built a solid skincare AI app with good premium gating. But to hit 6 figures/month ($100K+), you need ~10,000 paying subscribers at $9.99/mo. That means you need massive top-of-funnel traffic AND a conversion rate that doesn't leak. Here's what's missing or needs fixing:

---

## 1. Stripe Payment Integration (CRITICAL -- No Revenue Without This)

Right now the "Unlock Premium Now" button literally does `console.log('Upgrade clicked')`. Nobody can pay you. This is the #1 blocker.

- Integrate Stripe checkout into the PremiumUpgradeModal
- Create a backend function to handle subscription creation
- Add subscription status syncing so premium unlocks instantly after payment
- Add a customer portal link in Settings so users can manage/cancel

---

## 2. Social Auth (Google Sign-In)

Your auth is email/password only. Most mobile-first Gen Z users (your target) expect Google/Apple sign-in. Every extra friction point in signup = lost conversions.

- Add Google OAuth sign-in button
- Keep email/password as fallback
- Drastically reduces signup abandonment

---

## 3. Shareable Results / Viral Loop

You have zero viral mechanics. The #1 growth driver for skincare apps is users sharing their results on social media. You need:

- A "Share My Score" button after analysis that generates a branded card image (score, skin type, SKYN branding)
- Shareable progress timeline comparisons (before/after cards)
- Referral system: "Give a friend 1 free scan, get 1 free scan" -- drives organic growth

---

## 4. Onboarding-to-Scan Conversion Funnel

Right now a new user lands on the SKYN home tab and has to figure out what to do. The flow should be:

- After onboarding tutorial, auto-navigate to the Scan tab with a pulsing CTA
- Show a "First scan is FREE" badge prominently
- After the free scan, immediately show results with premium features blurred/locked to create urgency
- The premium modal should appear right after seeing results, not just when they try to access a gated feature

---

## 5. Push Notifications / Re-engagement

You have a service worker registered but no real push notification strategy. Users who churn never come back. Add:

- "Your monthly scan is due" push notification
- "Your morning routine is waiting" daily reminder
- "Your skin score may have changed -- rescan now" after 2 weeks of inactivity
- These are already partially built in ReminderSettings but not connected to actual push delivery

---

## 6. Free Trial Instead of Hard Paywall

Instead of 2 free scans then a wall, consider a 7-day free trial of premium. This lets users experience the full value (routines, AI coach, progress tracking) before asking them to pay. Conversion rates for free trials are typically 2-3x higher than hard paywalls.

---

## 7. Annual Plan Option

Add a $79.99/year option ($6.66/mo). This:
- Increases average revenue per user
- Reduces churn dramatically (annual subscribers churn ~5% vs ~8-12% monthly)
- Creates urgency: "Save 33% with annual"

---

## Technical Implementation Priority

| Priority | Task | Impact |
|----------|------|--------|
| 1 | Stripe integration for payments | No revenue without this |
| 2 | Share results / viral cards | Organic growth engine |
| 3 | Google OAuth | Reduces signup friction |
| 4 | Free trial mode (7 days) | Higher conversion rate |
| 5 | Annual pricing option | Higher LTV, lower churn |
| 6 | Onboarding funnel optimization | Better scan conversion |
| 7 | Push notification delivery | Re-engagement / retention |

### Files to be created/modified:
- **New**: Stripe edge function for checkout + webhook handling
- **New**: Share card generator component
- **Modified**: `PremiumUpgradeModal.tsx` -- connect to Stripe, add annual option
- **Modified**: `AuthModal.tsx` -- add Google OAuth button
- **Modified**: `useSubscription.tsx` -- add trial logic, annual plan support
- **Modified**: `AnalysisResults.tsx` -- add share button after results
- **Modified**: `OnboardingModal.tsx` -- auto-redirect to scan after completion
- **Modified**: `SkynLanding.tsx` -- add "First scan free" badge
- **New**: Referral system (backend table + edge function + UI component)
