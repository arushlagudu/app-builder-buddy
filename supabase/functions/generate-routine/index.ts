import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getIntensityDescription = (intensity: string) => {
  switch (intensity) {
    case 'simple':
      return `SIMPLE ROUTINE (3-4 steps max):
- Focus on essentials only: cleanser, moisturizer, sunscreen (AM) / cleanser, treatment, moisturizer (PM)
- One active ingredient maximum
- Perfect for beginners or busy lifestyles
- Frequency: Daily basics only`;
    case 'medium':
      return `MEDIUM ROUTINE (5-6 steps):
- Core essentials plus targeted treatments
- 2-3 active ingredients with proper layering
- Include exfoliation 2-3x weekly
- Add eye cream or spot treatments
- Balanced for most users`;
    case 'intense':
      return `INTENSE ROUTINE (7-10 steps):
- Comprehensive professional-level regimen
- Multiple actives with strategic rotation schedules
- Double cleansing, essences, serums, masks
- Weekly treatments (chemical peels, masks)
- For skincare enthusiasts seeking maximum results`;
    default:
      return 'MEDIUM ROUTINE';
  }
};

const systemPrompt = `You are a Senior Cosmetic Chemist and Board-Certified Dermatologist creating personalized skincare routines.

For each routine step, provide:
1. PRODUCT TYPE (e.g., "Gentle Foaming Cleanser")
2. SPECIFIC PRODUCT RECOMMENDATION with brand (e.g., "CeraVe Hydrating Cleanser")
3. WHEN TO USE: AM, PM, or BOTH
4. FREQUENCY: Daily, 2-3x weekly, weekly, as needed
5. HOW TO USE: Detailed application instructions (amount, technique, duration, tips)
6. WHY: Scientific rationale for this step

Respond ONLY with valid JSON:
{
  "routineTitle": "Your Personalized [Intensity] Routine",
  "routineSummary": "Brief overview of the routine philosophy",
  "morningRoutine": [
    {
      "step": 1,
      "productType": "Cleanser",
      "productName": "CeraVe Hydrating Cleanser",
      "frequency": "Daily",
      "howToUse": "Apply a small amount to damp skin, massage gently for 30-60 seconds, rinse with lukewarm water",
      "reason": "Removes overnight oil buildup while maintaining skin barrier with ceramides"
    }
  ],
  "eveningRoutine": [
    {
      "step": 1,
      "productType": "Oil Cleanser",
      "productName": "DHC Deep Cleansing Oil",
      "frequency": "Daily",
      "howToUse": "Apply to dry skin, massage for 1-2 minutes to dissolve makeup and SPF, emulsify with water, rinse",
      "reason": "Oil attracts oil - effectively removes sebum, makeup, and sunscreen without stripping"
    }
  ],
  "weeklyTreatments": [
    {
      "treatment": "Chemical Exfoliation",
      "productName": "Paula's Choice 2% BHA Liquid Exfoliant",
      "frequency": "2-3x weekly",
      "howToUse": "After cleansing, apply to cotton pad and sweep over face avoiding eye area. Don't rinse.",
      "reason": "Salicylic acid penetrates pores to clear congestion and smooth texture"
    }
  ],
  "tips": [
    "Wait 1-2 minutes between actives for better absorption",
    "Always apply thinnest to thickest consistency"
  ]
}`;

serve(async (req) => {
  console.log("generate-routine function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { intensity, skinType, concerns, problems, score, climate, pollution } = body;
    
    console.log("Generating routine with intensity:", intensity, "skinType:", skinType);
    
    if (!intensity || !skinType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: intensity and skinType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const intensityDescription = getIntensityDescription(intensity);

    const userPrompt = `Create a personalized skincare routine with these parameters:

INTENSITY LEVEL:
${intensityDescription}

USER PROFILE:
- Skin Type: ${skinType}
- Primary Concerns: ${concerns?.join(", ") || 'general maintenance'}
- Identified Problems: ${problems?.map((p: any) => p.title).join(", ") || 'none specified'}
- Current Skin Health Score: ${score || 'not assessed'}/10
- Climate: ${climate || 'temperate'}
- Pollution Level: ${pollution || 'moderate'}

Create a complete routine matching the ${intensity.toUpperCase()} intensity level with specific product recommendations, application instructions, and scientific rationales. Include weekly treatments if appropriate for the intensity level.

Return ONLY valid JSON following the specified format.`;

    console.log("Calling AI gateway for routine generation...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4000,
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
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI response received");
    
    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response
    let routineData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        routineData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse routine data");
    }

    console.log("Routine generated successfully");
    
    return new Response(
      JSON.stringify(routineData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-routine:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate routine";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
