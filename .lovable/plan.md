

## Remove Sparkles Icon from All Components

The Sparkles icon needs to be replaced across 6 files with more professional, clinical alternatives consistent with the app's branding.

### Changes by File

**1. `src/components/skin/SkinForm.tsx`**
- Remove `Sparkles` from imports
- "Skin Type" section header: replace with `Droplet` (already imported)
- "Analysis Depth" section header: replace with `Zap` (already imported)
- Advanced analysis tier icon: replace with `Wand2`

**2. `src/components/skin/RoutineGenerator.tsx`**
- Remove `Sparkles` from imports
- "Simple" intensity icon: replace with `Leaf` (already imported)
- "Balanced" philosophy icon: replace with `FlaskConical` (already imported)
- "Make My Routine" button icon: replace with `Wand2` (add to imports)

**3. `src/components/skin/FirstScanRequired.tsx`**
- Remove `Sparkles` from imports
- AI Coach highlight "Neural-powered daily insights": replace with `Bot`

**4. `src/components/skin/MonthlyScanReminder.tsx`**
- Remove `Sparkles` from imports
- "Adaptive coaching" icon: replace with `Brain` (already imported)

**5. `src/components/skin/AISkinCoach.tsx`**
- Remove `Sparkles` from imports
- Coach avatar icon: replace with `Bot` (already imported)

**6. `src/components/skin/DupeFinder.tsx`**
- Remove `Sparkles` from imports
- Empty state icon: replace with `Search` (add to imports)

### Technical Notes
- Each replacement uses either an already-imported icon or adds a contextually appropriate one (`Wand2`, `Search`, `Bot`)
- No structural or layout changes needed -- icon-only swaps
