import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are a cosmetic chemist analyzing skincare product ingredient labels for a specific user. You have access to:
1. The user's skin type and concerns
2. Their current skin health score and identified problems
3. Ingredients they should AVOID based on their dermatological analysis
4. Ingredients that are RECOMMENDED for their specific skin conditions

Your job is to evaluate product compatibility against this personalized profile.

When given an image of a product's ingredient list:
1. Extract the product name and brand if visible
2. Parse all ingredients from the label
3. Cross-reference each ingredient against:
   - The user's avoid list (flag as conflicts)
   - The user's recommended ingredients (flag as good)
   - Known irritants for their skin type
   - Ingredients that address their specific problems
4. Consider whether this product will help achieve their skincare goals

Respond ONLY with valid JSON:
{
  "productName": "Product Name",
  "brand": "Brand Name",
  "compatibilityScore": 85,
  "conflicts": [
    {"ingredient": "Ingredient Name", "reason": "Why it conflicts with user's profile", "severity": "high|medium|low"}
  ],
  "goodIngredients": ["Ingredient 1", "Ingredient 2"],
  "recommendations": ["Specific recommendation based on user's goals", "How to use with their routine"]
}

Score based on:
- 100%: Perfect for their specific skin profile, contains recommended ingredients, no conflicts
- 80-99%: Minor concerns but generally beneficial for their skin goals
- 60-79%: Some problematic ingredients for their profile
- <60%: Not recommended - conflicts with their skin needs or contains ingredients to avoid`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      image, 
      skinType, 
      concerns, 
      score, 
      problems, 
      avoidIngredients, 
      prescriptionIngredients 
    } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build a rich user profile for the AI
    const problemsList = problems?.map((p: { title: string; description: string }) => 
      `- ${p.title}: ${p.description}`
    ).join('\n') || 'No specific problems identified';
    
    const avoidList = avoidIngredients?.map((i: { name: string; reason: string }) => 
      `- ${i.name} (${i.reason})`
    ).join('\n') || 'No specific ingredients to avoid';
    
    const recommendedList = prescriptionIngredients?.map((i: { name: string; reason: string }) => 
      `- ${i.name} (${i.reason})`
    ).join('\n') || 'No specific ingredients recommended';

    const userPrompt = `Analyze this skincare product ingredient label for a user with the following profile:

SKIN PROFILE:
- Skin Type: ${skinType || 'unknown'}
- Concerns: ${concerns?.join(", ") || "general"}
- Current Skin Score: ${score || 'not assessed'}/10

IDENTIFIED SKIN PROBLEMS:
${problemsList}

INGREDIENTS TO AVOID (from dermatological analysis):
${avoidList}

RECOMMENDED INGREDIENTS (from dermatological analysis):
${recommendedList}

Based on this personalized profile, extract the product info and ingredients, then evaluate compatibility. Consider:
1. Does this product contain any ingredients the user should AVOID?
2. Does it contain ingredients RECOMMENDED for their specific issues?
3. Will this help address their identified skin problems?
4. Is this appropriate for their skin type and goals?

Return ONLY valid JSON with your analysis.`;

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
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        max_tokens: 2000,
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
    let analysisData;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      analysisData = JSON.parse(jsonStr);
    } catch (parseError) {
      throw new Error("Failed to parse AI response as JSON");
    }

    return new Response(JSON.stringify(analysisData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-product error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
