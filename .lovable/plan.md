# Refine AI Communication Style

Two backend prompt updates to make the AI output more human, readable, and personalized.

---

## 1. Skin Analysis Prompts (`supabase/functions/analyze-skin/index.ts`)

### Core Problems

- Update the system prompt to require plain, conversational language for problem descriptions
- Use analogies and "your skin" phrasing
- If a technical term appears, follow it with a parenthetical plain-English explanation, 
- overall still a well versed in depth explation, but not just blobs and blocks of tehcinal jargon with no explantion. The user should feel like talking to a smart friend bsaically, not a block of tecinial jargon

### Deep Analysis

- Keep it high-level and clinical -- technical terms are welcome here
- But every technical/medical term MUST be immediately followed by a parenthetical explanation
- Example style: "Your transepidermal water loss (the rate moisture escapes through your skin) is elevated, indicating compromised lipid lamellae (the protective fat layers between skin cells)."
- &nbsp;

---

## 2. AI Coach Prompts (`supabase/functions/ai-coach-chat/index.ts`)

### Formatting

- Short paragraphs (2-3 sentences max each)
- Use bullet points and line breaks -- never walls of text
- Max 3-4 short paragraphs or intro + bullet list

### Tone

- Conversational and warm, like a knowledgeable best friend
- Use "your" and "you" frequently

### Personalization Callouts

- Frequently reference the user's actual scan data with phrases like:
  - "Based on your scan, I noticed..."
  - "Since your skin scored X/10..."
  - "This isn't generic advice -- I'm pulling from your actual skin data"
  - "Your scan flagged [concern], so specifically for you..."
- This emphasizes the coach is data-driven, not giving random tips

### Accessibility

- Still expert-level advice, just delivered casually
- Use analogies when explaining why something works

---

## What Stays the Same

- No frontend/UI changes needed
- Science accuracy unchanged
- Premium vs free logic untouched
- All other prompt sections (ingredients, routine, scoring) unchanged