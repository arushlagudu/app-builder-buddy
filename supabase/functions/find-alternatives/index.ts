import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("find-alternatives function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { productName, skinType, concerns } = body;
    
    console.log("Finding alternatives for:", productName);
    
    if (!productName) {
      return new Response(
        JSON.stringify({ error: "No product name provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert skincare product analyst specializing in finding affordable alternatives (dupes) for luxury skincare products.

When given a product name, provide 3 budget-friendly alternatives that:
1. Have similar key active ingredients
2. Target the same skin concerns
3. Are significantly more affordable (preferably drugstore or mid-range brands)

${skinType ? `User's skin type: ${skinType}` : ''}
${concerns?.length ? `User's concerns: ${concerns.join(', ')}` : ''}

Respond in valid JSON format only, no markdown or additional text:
{
  "originalProduct": {
    "name": "string",
    "estimatedPrice": number,
    "keyIngredients": ["string"]
  },
  "alternatives": [
    {
      "name": "string",
      "brand": "string",
      "price": number,
      "savings": "string (e.g., 'Save ~$40')",
      "matchScore": number (1-100, how similar to original),
      "keyIngredients": ["string"],
      "whyItsGood": "string (brief explanation)"
    }
  ]
}`;

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
          { role: "user", content: `Find affordable alternatives for: ${productName}` }
        ],
        max_tokens: 1000,
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
    let content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Clean up the response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse alternatives data");
    }

    console.log("Alternatives found successfully");
    
    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in find-alternatives:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to find alternatives";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
