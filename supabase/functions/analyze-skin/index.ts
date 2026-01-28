import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getBudgetGuidelines = (budget: string) => {
  switch (budget) {
    case 'budget':
      return `BUDGET TIER (Drugstore/Affordable):
- Recommend affordable drugstore brands: CeraVe, The Ordinary, Cetaphil, Neutrogena, La Roche-Posay (drugstore line), Vanicream, Aveeno
- Keep total routine cost under $50
- Focus on multi-purpose products when possible`;
    case 'luxury':
      return `LUXURY TIER (Premium):
- Recommend high-end brands: SkinCeuticals, Drunk Elephant, Sunday Riley, Tatcha, Dr. Dennis Gross, iS Clinical
- Prioritize advanced formulations and elegant textures
- Premium ingredients and sophisticated delivery systems`;
    case 'mid':
    default:
      return `MID-RANGE TIER:
- Recommend quality brands: Paula's Choice, Good Molecules, Versed, Inkey List, First Aid Beauty, Glow Recipe
- Balance between efficacy and value
- Quality actives at reasonable prices`;
  }
};

const systemPrompt = `You are a Senior Cosmetic Chemist and Board-Certified Dermatologist. Analyze skin images and provide clinical assessments.

IMPORTANT: Keep the routine SIMPLE and PRACTICAL (3-4 steps per routine max for free analysis).

When analyzing a user's skin, provide:

1. CORE PROBLEMS: Diagnose 2-3 physiological causes with brief explanations.

2. SKIN HEALTH SCORE (1-10): Based on overall skin condition.

3. DEEP ANALYSIS: Brief explanation of what's happening with their skin (2-3 sentences).

4. INGREDIENT FILTERING:
   - AVOID: 3-4 ingredients to avoid
   - PRESCRIPTION: 3-4 beneficial ingredients

5. ROUTINE: KEEP IT SIMPLE!
   - AM: 3-4 steps max (cleanser, treatment/serum, moisturizer, SPF)
   - PM: 3-4 steps max (cleanser, treatment, moisturizer)
   - NO lip products, NO separate eye creams for basic routine
   - One active treatment per routine

Respond ONLY with valid JSON:
{
  "score": 7.5,
  "problems": [
    {"title": "Problem Name", "description": "Brief explanation", "icon": "hydration|inflammation|barrier"}
  ],
  "deepAnalysis": "Brief biological explanation...",
  "avoidIngredients": [{"name": "Ingredient", "reason": "Why to avoid"}],
  "prescriptionIngredients": [{"name": "Ingredient", "reason": "Mechanism"}],
  "routine": [{"time": "AM|PM", "step": 1, "product": "Product by Brand", "reason": "Brief rationale"}]
}`;

serve(async (req) => {
  console.log("analyze-skin function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { image, skinType, concerns, climate, pollution, budget } = body;
    
    console.log("Received request with skinType:", skinType, "concerns:", concerns, "budget:", budget);
    
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

    const budgetGuidelines = getBudgetGuidelines(budget || 'mid');

    const userPrompt = `Analyze this skin image:
- Skin Type: ${skinType || 'unknown'}
- Concerns: ${concerns?.join(", ") || 'general'}
- Climate: ${climate || 'temperate'}
- Pollution: ${pollution || 'moderate'}

${budgetGuidelines}

IMPORTANT: Keep the routine SIMPLE - max 3-4 products for AM and 3-4 for PM. No lip products or extras.
Provide health score, 2-3 core problems, brief analysis, avoid/prescription ingredients, and a SIMPLE AM/PM routine matching the budget tier. Return ONLY valid JSON.`;

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
