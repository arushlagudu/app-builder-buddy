import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are an AI skin coach providing HIGHLY PERSONALIZED daily skincare tips. You have access to the user's complete dermatological profile including:
- Their skin type and specific concerns
- Their latest skin health score and identified problems
- Ingredients they should avoid
- Ingredients that are recommended for them
- Their environmental conditions

Generate 3 tips that are DIRECTLY RELEVANT to their specific situation:

1. A routine tip (about their specific routine, timing, technique - reference their actual skin problems)
2. An environmental tip (based on their climate and how it affects their specific skin issues)
3. A wellness/lifestyle tip (diet, sleep, hydration - targeted to their concerns)

CRITICAL: Each tip MUST reference their actual skin data. Don't give generic advice. For example:
- If they have dehydration issues, mention specific hydration strategies
- If they should avoid certain ingredients, remind them
- If they have a low score in certain areas, address those specifically

Respond ONLY with valid JSON array:
[
  {"type": "routine", "title": "Short Title", "content": "Personalized tip referencing their specific issues"},
  {"type": "weather", "title": "Short Title", "content": "Environmental tip for their climate and skin type"},
  {"type": "general", "title": "Short Title", "content": "Lifestyle tip targeting their concerns"}
]`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      skinType, 
      concerns, 
      climate,
      score,
      problems,
      avoidIngredients,
      prescriptionIngredients
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build rich context from user's skin analysis
    const problemsList = problems?.map((p: { title: string; description: string }) => 
      `- ${p.title}: ${p.description}`
    ).join('\n') || 'No specific problems identified';
    
    const avoidList = avoidIngredients?.map((i: { name: string }) => i.name).join(', ') || 'None specified';
    const recommendedList = prescriptionIngredients?.map((i: { name: string }) => i.name).join(', ') || 'None specified';

    const userPrompt = `Generate 3 HIGHLY PERSONALIZED skincare tips for today based on this user's profile:

SKIN PROFILE:
- Skin Type: ${skinType || 'normal'}
- Concerns: ${concerns?.join(", ") || "general maintenance"}
- Climate: ${climate || 'temperate'}
- Current Skin Score: ${score || 'not assessed'}/10
- Current Date: ${new Date().toLocaleDateString()}

IDENTIFIED SKIN PROBLEMS (from their latest analysis):
${problemsList}

INGREDIENTS TO AVOID:
${avoidList}

RECOMMENDED INGREDIENTS:
${recommendedList}

IMPORTANT: Make each tip SPECIFIC to their profile. Reference their actual problems, score, and concerns. Don't give generic advice - make it personal.

For example:
- If their score is low (below 6), be encouraging and focus on foundational improvements
- If they have specific problems like dehydration or inflammation, address those directly
- If they should avoid certain ingredients, remind them to check product labels

Return ONLY valid JSON array.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      throw new Error(`AI gateway error: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response
    let tips;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      tips = JSON.parse(jsonStr);
    } catch (parseError) {
      throw new Error("Failed to parse AI response as JSON");
    }

    return new Response(JSON.stringify(tips), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-tips error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
