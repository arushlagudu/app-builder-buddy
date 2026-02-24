

# Fix Data Flow, Progress Analytics, and AI Data Optimization

There are several concrete bugs and gaps causing data to not flow correctly across features. Here's what's broken and the fix for each.

---

## Issues Found

### 1. Scan images never saved to analysis history
When a scan completes, the `image_url` field is never included in the database insert. The `imageData` (base64 photo) exists in state but is skipped when saving to `analysis_history`. This means progress photos, history views, and any feature trying to show the scan image will have nothing to display.

### 2. TrendAnalytics doesn't filter by user
The `TrendAnalytics` component queries `analysis_history` without filtering by `user_id`, which means RLS is the only protection but may cause unexpected empty results or errors.

### 3. AI Coach doesn't receive climate data
The AI Coach edge function receives skin type, concerns, score, problems, and ingredients -- but `climate` is passed as a prop to the component and never sent in the API request body. The `buildSkinContext` function also doesn't include it.

### 4. Daily tip generator has limited context
The `generate-daily-tip` function only pulls `skin_type`, `concerns`, `score`, and `problems` from the latest analysis. It doesn't include `avoid_ingredients`, `prescription_ingredients`, or `climate` -- meaning tips aren't as personalized as they could be.

---

## Plan

### Fix 1: Save image_url when saving analysis to history
**File:** `src/pages/Index.tsx` -- `saveAnalysisToHistory` function

Add `image_url: imageData` to the `analysis_history` insert call so the user's scan photo is stored alongside results.

### Fix 2: Add user_id filter to TrendAnalytics
**File:** `src/components/skin/TrendAnalytics.tsx`

Add `.eq('user_id', user.id)` to the `fetchAnalytics` query so it explicitly filters by the current user.

### Fix 3: Pass climate to AI Coach API call
**File:** `src/components/skin/AISkinCoach.tsx`

Add `climate` to the request body sent to the `ai-coach-chat` edge function.

**File:** `supabase/functions/ai-coach-chat/index.ts`

- Extract `climate` from the request body
- Pass it to `buildSkinContext`
- Add climate info to the context string (e.g., "Climate: tropical")

### Fix 4: Enrich daily tip generator with full analysis data
**File:** `supabase/functions/generate-daily-tip/index.ts`

Expand the `select` query to also fetch `avoid_ingredients`, `prescription_ingredients`, `climate`, and `pollution`. Include these in the AI prompt so tips are more personalized.

### Fix 5: Pass previousScore to AI Coach context
**File:** `supabase/functions/ai-coach-chat/index.ts`

Accept `previousScore` from the request body and add it to the skin context (e.g., "Previous Score: 6.2/10 -- Score improved by +1.3"). This lets the coach reference progress.

**File:** `src/components/skin/AISkinCoach.tsx`

Add `previousScore` to the API request body (it's already a prop but not sent).

---

## Summary of Files to Edit

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Add `image_url: imageData` to analysis insert |
| `src/components/skin/TrendAnalytics.tsx` | Add `.eq('user_id', user.id)` to query |
| `src/components/skin/AISkinCoach.tsx` | Add `climate` and `previousScore` to API request body |
| `supabase/functions/ai-coach-chat/index.ts` | Accept + use `climate` and `previousScore` in context |
| `supabase/functions/generate-daily-tip/index.ts` | Fetch and use full analysis data in prompt |

