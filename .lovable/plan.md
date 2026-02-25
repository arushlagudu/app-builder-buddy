

# Remaining Bugs and Optimization Fixes

After a thorough audit of the codebase, here are all the remaining issues holding the app back from its full potential.

---

## Bug 1: HistoryView doesn't filter by user_id

**Problem:** `src/components/skin/HistoryView.tsx` queries `analysis_history` without `.eq('user_id', user.id)`. While RLS protects the data, this is inconsistent with other components (TrendAnalytics was just fixed) and can cause silent failures.

**Fix:** Add `.eq('user_id', user.id)` to the `fetchHistory` query (line 33-36).

---

## Bug 2: ProgressTimeline doesn't filter by user_id

**Problem:** `src/components/skin/ProgressTimeline.tsx` queries `progress_photos` without `.eq('user_id', user.id)` (line 34-37). Same issue as above.

**Fix:** Add `.eq('user_id', user.id)` to the `fetchPhotos` query.

---

## Bug 3: Progress photos never linked to scan scores

**Problem:** When a scan completes and saves to `analysis_history`, no corresponding `progress_photo` is created. The `progress_photos` table has a `skin_score` and `analysis_id` column, but they're never populated from scan results. This means the Progress Timeline always shows photos with no score, and the score trend in that view is always null.

**Fix:** After saving analysis to history in `src/pages/Index.tsx`, also insert a record into `progress_photos` with the scan image, score, and analysis ID. This bridges the gap between scan results and the progress timeline.

---

## Bug 4: Streaks and Achievements are disconnected

**Problem:** The `useAchievements` hook has a `checkAndUnlock` function, but it's never called anywhere. Users can build streaks but achievements are never actually checked/unlocked.

**Fix:** In `src/components/skin/StreakTracker.tsx`, after a successful `markComplete`, call `checkAndUnlock(stats.currentStreak)` from the achievements hook.

---

## Bug 5: AI Coach doesn't send avoidIngredients and prescriptionIngredients data correctly

**Problem:** In `AISkinCoach.tsx`, `avoidIngredients` and `prescriptionIngredients` are sent in the API body, but the AI coach edge function already receives them. However, the `climate` field was just fixed. Looking deeper, the edge function's `buildSkinContext` includes ingredient names but not reasons -- which means the AI coach can say "avoid X" but can't explain why without the reason data.

**Fix:** Update `buildSkinContext` in `supabase/functions/ai-coach-chat/index.ts` to include both the ingredient name AND reason (e.g., "Retinol (can cause irritation with sensitive skin)").

---

## Bug 6: RoutineGenerator doesn't pass avoidIngredients to the edge function

**Problem:** The `generate-routine` edge function builds a user profile prompt but never receives or uses the user's `avoidIngredients` or `prescriptionIngredients`. This means generated routines could recommend products containing ingredients the user should avoid.

**Fix:** 
- In `src/components/skin/RoutineGenerator.tsx`, add `avoidIngredients` and `prescriptionIngredients` props and pass them in the API request body.
- In `supabase/functions/generate-routine/index.ts`, extract these from the request and include them in the user prompt (e.g., "MUST AVOID these ingredients: ...").
- Update the parent in `Index.tsx` to pass these props to `RoutineGenerator`.

---

## Bug 7: Share card says "Dermatologist Certified" -- misleading

**Problem:** `ShareScoreCard.tsx` line 119 renders "Dermatologist Certified" on generated share images. This is not accurate and could be legally problematic.

**Fix:** Change to "AI-Powered Analysis" or "Powered by SKYN AI".

---

## Summary of Files to Edit

| File | Change |
|------|--------|
| `src/components/skin/HistoryView.tsx` | Add `.eq('user_id', user.id)` to query |
| `src/components/skin/ProgressTimeline.tsx` | Add `.eq('user_id', user.id)` to query |
| `src/pages/Index.tsx` | Auto-save progress photo after scan with score + analysis_id |
| `src/components/skin/StreakTracker.tsx` | Call `checkAndUnlock` after marking routine complete |
| `supabase/functions/ai-coach-chat/index.ts` | Include ingredient reasons in context |
| `src/components/skin/RoutineGenerator.tsx` | Accept + send avoidIngredients/prescriptionIngredients |
| `supabase/functions/generate-routine/index.ts` | Use avoid/prescription ingredients in prompt |
| `src/components/skin/ShareScoreCard.tsx` | Fix misleading "Dermatologist Certified" text |

