import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are an AI skin coach providing personalized daily skincare tips. Generate 3 tips:

1. A routine tip (about applying products, timing, technique)
2. A weather/environmental tip (based on climate)
3. A general wellness tip (diet, sleep, hydration)

Make tips specific, actionable, and based on the user's skin profile.

Respond ONLY with valid JSON array:
[
  {"type": "routine", "title": "Short Title", "content": "Detailed tip content"},
  {"type": "weather", "title": "Short Title", "content": "Detailed tip content"},
  {"type": "general", "title": "Short Title", "content": "Detailed tip content"}
]`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { skinType, concerns, climate } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = `Generate 3 personalized skincare tips for today.
User profile:
- Skin Type: ${skinType || 'normal'}
- Concerns: ${concerns?.join(", ") || "general maintenance"}
- Climate: ${climate || 'temperate'}
- Current date: ${new Date().toLocaleDateString()}

Make tips specific and actionable. Return ONLY valid JSON array.`;

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
        max_tokens: 1000,
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
