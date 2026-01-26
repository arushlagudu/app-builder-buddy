import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are a Senior Cosmetic Chemist and Board-Certified Dermatologist. Analyze skin images and provide clinical assessments.

When analyzing a user's skin, provide:

1. CORE PROBLEMS: Diagnose 3 physiological causes with biological mechanisms.

2. SKIN HEALTH SCORE (1-10): Deduct points for inflammation, barrier damage, dehydration, breakouts, hyperpigmentation.

3. DEEP ANALYSIS: Explain using terms like TEWL, sebum oxidation, glycation, melanin dysregulation.

4. INGREDIENT FILTERING:
   - AVOID: Surfactants, alcohols, fragrances that trigger the user's skin
   - PRESCRIPTION: Active chemicals with mechanisms

5. ROUTINE: AM/PM with pH-correct ordering and real product recommendations.

Respond ONLY with valid JSON:
{
  "score": 7.5,
  "problems": [
    {"title": "Problem Name", "description": "Clinical explanation", "icon": "hydration|inflammation|barrier"}
  ],
  "deepAnalysis": "Biological explanation...",
  "avoidIngredients": [{"name": "Ingredient", "reason": "Why to avoid"}],
  "prescriptionIngredients": [{"name": "Ingredient", "reason": "Mechanism"}],
  "routine": [{"time": "AM|PM|BOTH", "step": 1, "product": "Product by Brand", "reason": "Rationale"}]
}`;

serve(async (req) => {
  console.log("analyze-skin function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { image, skinType, concerns, climate, pollution } = body;
    
    console.log("Received request with skinType:", skinType, "concerns:", concerns);
    
    if (!image) {
      console.error("No image provided");
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check image size (rough estimate from base64)
    const imageSizeKB = Math.round((image.length * 3) / 4 / 1024);
    console.log("Image size approx:", imageSizeKB, "KB");
    
    if (imageSizeKB > 4000) {
      console.error("Image too large:", imageSizeKB, "KB");
      return new Response(
        JSON.stringify({ error: "Image too large. Please use a smaller image." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = `Analyze this skin image:
- Skin Type: ${skinType || 'unknown'}
- Concerns: ${concerns?.join(", ") || 'general'}
- Climate: ${climate || 'temperate'}
- Pollution: ${pollution || 'moderate'}

Provide health score, 3 core problems, deep analysis, avoid/prescription ingredients, and AM/PM routine with real products. Return ONLY valid JSON.`;

    console.log("Calling AI gateway...");
    
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
              {
                type: "image_url",
                image_url: { url: image },
              },
            ],
          },
        ],
        max_tokens: 3000,
      }),
    });

    console.log("AI gateway response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    console.log("AI response received");
    
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response:", JSON.stringify(aiResponse));
      throw new Error("No content in AI response");
    }

    // Parse JSON from the response (handle potential markdown code blocks)
    let analysisData;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      analysisData = JSON.parse(jsonStr);
      console.log("Successfully parsed analysis data");
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content.substring(0, 500));
      throw new Error("Failed to parse AI response as JSON");
    }

    return new Response(JSON.stringify(analysisData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-skin error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
