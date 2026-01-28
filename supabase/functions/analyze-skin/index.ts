import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getBudgetGuidelines = (budget: string) => {
  switch (budget) {
    case 'budget':
      return {
        guidelines: `BUDGET TIER (Drugstore/Affordable):
- Recommend affordable drugstore brands: CeraVe, The Ordinary, Cetaphil, Neutrogena, La Roche-Posay (drugstore line), Vanicream, Aveeno
- Keep total routine cost under $50
- Focus on multi-purpose products when possible`,
        priceRange: { min: 5, max: 20 }
      };
    case 'luxury':
      return {
        guidelines: `LUXURY TIER (Premium):
- Recommend high-end brands: SkinCeuticals, Drunk Elephant, Sunday Riley, Tatcha, Dr. Dennis Gross, iS Clinical
- Prioritize advanced formulations and elegant textures
- Premium ingredients and sophisticated delivery systems`,
        priceRange: { min: 40, max: 150 }
      };
    case 'mid':
    default:
      return {
        guidelines: `MID-RANGE TIER:
- Recommend quality brands: Paula's Choice, Good Molecules, Versed, Inkey List, First Aid Beauty, Glow Recipe
- Balance between efficacy and value
- Quality actives at reasonable prices`,
        priceRange: { min: 15, max: 45 }
      };
  }
};

const getTierGuidelines = (tier: string) => {
  switch (tier) {
    case 'basic':
      return {
        steps: '3-4',
        instruction: 'Keep routine SIMPLE with only 3-4 essential steps per routine (cleanser, treatment OR serum, moisturizer, SPF for AM).',
        deepAnalysis: false
      };
    case 'advanced':
      return {
        steps: '4-5',
        instruction: 'Provide a more comprehensive routine with 4-5 steps per routine (cleanser, toner/essence, serum, moisturizer, SPF for AM).',
        deepAnalysis: false
      };
    case 'premium':
    default:
      return {
        steps: '5-7',
        instruction: 'Provide a full professional routine with 5-7 steps including all necessary actives, treatments, and specialty products.',
        deepAnalysis: true
      };
  }
};

const getSystemPrompt = (tier: { steps: string; instruction: string; deepAnalysis: boolean }) => `You are a Senior Cosmetic Chemist and Board-Certified Dermatologist. Analyze skin images and provide clinical assessments.

ROUTINE COMPLEXITY: ${tier.instruction}

When analyzing a user's skin, provide:

1. CORE PROBLEMS: Diagnose 2-3 physiological causes with detailed explanations.

2. SKIN HEALTH SCORE (1-10): Based on overall skin condition.

3. DEEP ANALYSIS: ${tier.deepAnalysis 
    ? 'Provide an in-depth biological explanation covering skin barrier function, cellular turnover, inflammation markers, and long-term prognosis (4-6 sentences).'
    : 'Brief explanation of what\'s happening with their skin (2-3 sentences).'}

4. INGREDIENT FILTERING:
   - AVOID: 4-5 ingredients to avoid with detailed reasons
   - PRESCRIPTION: 5-6 beneficial ingredients with scientific mechanisms

5. ROUTINE: ${tier.steps} steps per routine
   - Include estimated price for each product in USD
   - Format product as "Product Name by Brand (~$XX)"
   
Respond ONLY with valid JSON:
{
  "score": 7.5,
  "problems": [
    {"title": "Problem Name", "description": "Detailed explanation of the physiological cause", "icon": "hydration|inflammation|barrier"}
  ],
  "deepAnalysis": "Biological explanation...",
  "avoidIngredients": [{"name": "Ingredient", "reason": "Detailed reason why to avoid"}],
  "prescriptionIngredients": [{"name": "Ingredient", "reason": "Scientific mechanism of action"}],
  "routine": [{"time": "AM|PM", "step": 1, "product": "Product by Brand (~$XX)", "price": 15, "reason": "Brief rationale"}]
}`;

serve(async (req) => {
  console.log("analyze-skin function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { image, skinType, concerns, climate, pollution, budget, analysisTier } = body;
    
    console.log("Received request with skinType:", skinType, "concerns:", concerns, "budget:", budget, "tier:", analysisTier);
    
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

    const budgetInfo = getBudgetGuidelines(budget || 'mid');
    const tierInfo = getTierGuidelines(analysisTier || 'basic');
    const systemPrompt = getSystemPrompt(tierInfo);

    const userPrompt = `Analyze this skin image:
- Skin Type: ${skinType || 'unknown'}
- Concerns: ${concerns?.join(", ") || 'general'}
- Climate: ${climate || 'temperate'}
- Pollution: ${pollution || 'moderate'}

${budgetInfo.guidelines}

PRICE GUIDANCE: Products should range from $${budgetInfo.priceRange.min} to $${budgetInfo.priceRange.max} each.

ROUTINE STEPS: Provide exactly ${tierInfo.steps} steps for AM and ${tierInfo.steps} steps for PM.

Provide health score, 2-3 core problems with detailed explanations, ${tierInfo.deepAnalysis ? 'comprehensive' : 'brief'} analysis, avoid/prescription ingredients with scientific rationale, and an AM/PM routine matching the budget tier with price estimates. Return ONLY valid JSON.`;

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
