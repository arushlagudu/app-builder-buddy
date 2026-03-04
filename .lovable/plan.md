

# Add Skin Profile Cross-Reference Banner to Product Scanner

## What Changes

Add a visible banner/card in the Product Scanner that tells users their face scan data is being used to personalize the product analysis. This should appear:

1. **When a scan exists**: Show a confirmation card with a summary (skin type, number of concerns, number of ingredients being checked) so the user knows their profile is active.
2. **When no scan exists**: Show a prompt telling the user to complete a face scan first for personalized results.

## File to Edit

**`src/components/skin/ProductScanner.tsx`**

- Add a new card between the instructions card and the blur warning/scanner card
- If `skinType` and `score` props exist (user has done a scan):
  - Show a green-tinted card with a shield/check icon: **"Personalized for your skin"**
  - Subtitle: "Your face scan results are being cross-referenced to check ingredient compatibility"
  - Show quick stats: skin type, number of concerns, number of ingredients being monitored (avoid + recommended counts)
- If no scan data exists (props are empty/null):
  - Show an amber-tinted card: **"Complete a face scan first"**
  - Subtitle: "Get a personalized analysis by scanning your face first — we'll cross-reference ingredients against your skin profile"
- Uses existing props (`skinType`, `concerns`, `score`, `avoidIngredients`, `prescriptionIngredients`) — no new data needed

No edge function or database changes required — this is purely a UI awareness feature.

