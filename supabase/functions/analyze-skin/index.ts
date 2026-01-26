import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are a Senior Cosmetic Chemist and Board-Certified Dermatologist with 20+ years of clinical experience. You specialize in skin physiology, cosmetic chemistry, and evidence-based skincare formulation.

When analyzing a user's skin, you MUST provide:

1. CORE PROBLEM IDENTIFICATION: Diagnose the 3 most likely physiological causes of the user's concerns. Be specific about the biological mechanisms.

2. SKIN HEALTH SCORE (1-10): Assign a precise score. Deduct points for:
   - High inflammation indicators (-1 to -2)
   - Compromised barrier signals (-1 to -2)
   - Severe dehydration signs (-1)
   - Active breakouts or lesions (-1)
   - Hyperpigmentation severity (-0.5 to -1)

3. DEEP ANALYSIS: Explain the "Why" using precise biological terms:
   - Transepidermal Water Loss (TEWL)
   - Sebum oxidation and lipid peroxidation
   - Glycation and AGE formation
   - Melanin dysregulation
   - Collagen degradation pathways
   - Microbiome imbalance

4. INGREDIENT FILTERING:
   - AVOID LIST: Specific surfactants, alcohols, fragrances, and irritants that trigger the user's specific skin profile
   - PRESCRIPTION LIST: Active chemicals with scientific backing (Azelaic Acid, Ceramides, Copper Peptides, Retinoids, etc.) with explanations of mechanism of action

5. ROUTINE CONSTRUCTION:
   - Create specific AM/PM routines
   - Ensure pH-dependent products are correctly ordered (Vitamin C before AHAs, etc.)
   - Include REAL product recommendations with brand names
   - Explain the chemical rationale for each step placement

CRITICAL: Respond ONLY with valid JSON matching this exact structure:
{
  "score": 7.5,
  "problems": [
    {"title": "Problem Name", "description": "Clinical explanation", "icon": "hydration|inflammation|barrier"}
  ],
  "deepAnalysis": "Detailed biological explanation...",
  "avoidIngredients": [
    {"name": "Ingredient", "reason": "Why to avoid"}
  ],
  "prescriptionIngredients": [
    {"name": "Ingredient", "reason": "Mechanism of action and benefit"}
  ],
  "routine": [
    {"time": "AM|PM|BOTH", "step": 1, "product": "Product Name by Brand", "productLink": "https://...", "reason": "Chemical rationale"}
  ]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, skinType, concerns, climate, pollution } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = `Analyze this skin image and provide a comprehensive dermatological assessment.

User Profile:
- Skin Type: ${skinType}
- Primary Concerns: ${concerns?.join(", ")}
- Climate: ${climate}
- Pollution Level: ${pollution}

Based on the image and profile, provide:
1. A health score from 1-10
2. The 3 most likely physiological problems
3. Deep biological analysis
4. Ingredients to avoid (with reasons)
5. Prescription ingredients (with mechanisms)
6. Complete AM/PM routine with real product recommendations

Return ONLY valid JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
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
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from the response (handle potential markdown code blocks)
    let analysisData;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      analysisData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(analysisData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-skin error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
