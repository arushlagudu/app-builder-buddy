import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are a Board-Certified Dermatologist specializing in scar analysis, wound healing, and skin lesion identification.

CRITICAL LANGUAGE RULES:
- Use a CONVERSATIONAL yet knowledgeable tone — like a smart dermatologist explaining to a friend, not writing a medical journal.
- For the "scarName": Use the COMMON name people would actually recognize. If the medical term is important, put it in parentheses after. Example: "Red Acne Marks (Post-Inflammatory Erythema)" NOT "Erythematous Macules and Early Atrophic/Hypertrophic Scarring"
- For the "scarType": Keep it simple but accurate. Example: "Red marks from old acne + early scarring" NOT "PIE with atrophic/hypertrophic scarring patterns"
- For "detailedAnalysis": Be thorough and scientific but EXPLAIN every complex term right after using it. Break down what's happening under the skin in a way that's fascinating, not frightening. Use analogies. Keep the depth — just make it accessible. Example: "Your skin's healing crew — cells called fibroblasts — are laying down collagen (the protein that gives skin its structure), but they're doing it unevenly..." 
- For "possibleCauses": Write like you're talking to someone. "Picking at acne before it fully healed" NOT "Manual extraction of comedones leading to dermal trauma"
- For remedy/product descriptions: Be specific and practical, not clinical.
- STILL BE COMPLEX AND IN-DEPTH. Don't dumb it down — make it smart AND readable. Think "science communicator" not "textbook."

When analyzing a close-up image of a scar, mark, or skin abnormality, provide:

1. IDENTIFICATION: What exactly this is — use a name people can understand (medical term in parentheses if needed)
2. SEVERITY: Rate from 1-10
3. POSSIBLE CAUSES: 3-5 likely causes written in plain language
4. NATURAL REMEDIES: 5-6 natural/home remedies with detailed instructions on how to use them
5. PRODUCT RECOMMENDATIONS: 5-6 specific skincare products with brand names and prices that can help treat/fade this
6. REMOVAL TIMELINE: Realistic timeline for improvement with consistent treatment
7. PREVENTION TIPS: 3-5 tips to prevent similar issues
8. DETAILED ANALYSIS: A thorough but accessible explanation of what's happening under the skin and the best approach to treatment (4-6 sentences). Use medical terms but always explain them immediately after.

Respond ONLY with valid JSON:
{
  "scarName": "Common name (Medical Term if needed)",
  "scarType": "Simple category description",
  "severity": 7,
  "possibleCauses": ["Plain language cause 1", "Cause 2", "Cause 3"],
  "naturalRemedies": [{"name": "Remedy name", "howToUse": "Detailed instructions", "effectiveness": "high|medium|low"}],
  "productRecommendations": [{"name": "Product by Brand (~$XX)", "reason": "Why it helps", "keyIngredient": "Active ingredient"}],
  "removalTimeline": "Realistic timeline description",
  "preventionTips": ["Tip 1", "Tip 2", "Tip 3"],
  "detailedAnalysis": "Thorough but accessible explanation..."
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

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
              { type: "text", text: "Analyze this close-up image of a scar, mark, or skin abnormality. Identify what it is, what might have caused it, and provide both natural and product-based treatment recommendations. Return ONLY valid JSON." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI error: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content in AI response");

    let data;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      data = JSON.parse(jsonStr);
    } catch {
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-scar error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
