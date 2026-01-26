import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are a cosmetic chemist analyzing skincare product ingredient labels. When given an image of a product's ingredient list:

1. Extract the product name and brand if visible
2. Parse all ingredients from the label
3. Evaluate each ingredient against the user's skin profile
4. Identify conflicts and good ingredients

Respond ONLY with valid JSON:
{
  "productName": "Product Name",
  "brand": "Brand Name",
  "compatibilityScore": 85,
  "conflicts": [
    {"ingredient": "Ingredient Name", "reason": "Why it conflicts", "severity": "high|medium|low"}
  ],
  "goodIngredients": ["Ingredient 1", "Ingredient 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}

Score based on:
- 100%: Perfect for skin type, no conflicts
- 80-99%: Minor concerns, generally safe
- 60-79%: Some problematic ingredients
- <60%: Not recommended for this skin type`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, skinType, concerns } = await req.json();

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

    const userPrompt = `Analyze this skincare product ingredient label.
User's skin profile:
- Skin Type: ${skinType}
- Concerns: ${concerns?.join(", ") || "general"}

Extract the product info and ingredients, then evaluate compatibility. Return ONLY valid JSON.`;

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
