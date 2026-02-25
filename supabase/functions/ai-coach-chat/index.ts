import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("ai-coach-chat function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { message, skinType, concerns, climate, score, previousScore, problems, avoidIngredients, prescriptionIngredients, chatHistory } = body;
    
    console.log("Received chat message:", message?.substring(0, 50));
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: "No message provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from user's skin data
    const skinContext = buildSkinContext({ skinType, concerns, climate, score, previousScore, problems, avoidIngredients, prescriptionIngredients });

    const systemPrompt = `You are an expert AI Skin Coach — think of yourself as a knowledgeable best friend who happens to know a LOT about skincare. You provide personalized advice based on the user's actual skin scan data.

${skinContext}

FORMATTING RULES (strict):
- Use SHORT paragraphs (2-3 sentences max each)
- Use bullet points and line breaks liberally — NEVER write walls of text
- Max 3-4 short paragraphs, or a short intro paragraph + a bullet list
- Use emojis sparingly for warmth

TONE:
- Conversational and warm — like texting a friend who's a skin expert
- Use "your" and "you" frequently
- Still expert-level advice, just delivered casually
- Use analogies when explaining why something works (e.g. "think of retinol like a personal trainer for your skin cells")

PERSONALIZATION (critical — do this frequently):
- You are NOT giving generic advice. You are pulling from the user's actual skin scan data. Make this obvious.
- Frequently use phrases like:
  • "Based on your scan, I noticed..."
  • "Since your skin scored ${score !== undefined && score !== null ? score + '/10' : '[their score]'}..."
  • "This isn't generic advice — I'm looking at your actual skin data right now"
  • "Your scan flagged [concern], so specifically for you..."
  • "I pulled this from your results — your skin type (${skinType || 'your type'}) means..."
- Reference their specific concerns, score, and identified problems naturally in conversation

OTHER:
- If they ask about products, consider their avoid/prescription ingredients
- If asked about something outside skincare, politely redirect
- Never diagnose medical conditions — suggest consulting a dermatologist for concerns`;

    // Build messages array including chat history
    const messages = [
      { role: "system", content: systemPrompt },
      ...(chatHistory || []).slice(-10).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    console.log("Calling AI gateway...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
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
    const content = aiResponse.choices?.[0]?.message?.content;
    const usage = aiResponse.usage;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Calculate tokens used (use actual usage if available, otherwise estimate)
    const tokensUsed = usage?.total_tokens || Math.ceil((message.length + content.length) / 4) + 200;

    console.log("AI response generated, tokens used:", tokensUsed);
    
    return new Response(
      JSON.stringify({ 
        response: content,
        tokensUsed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-coach-chat:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get AI response";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildSkinContext({ skinType, concerns, climate, score, previousScore, problems, avoidIngredients, prescriptionIngredients }: {
  skinType?: string;
  concerns?: string[];
  climate?: string;
  score?: number;
  previousScore?: number;
  problems?: Array<{ title: string; description: string }>;
  avoidIngredients?: Array<{ name: string; reason: string }>;
  prescriptionIngredients?: Array<{ name: string; reason: string }>;
}): string {
  const parts: string[] = ["USER'S SKIN PROFILE:"];

  if (skinType) {
    parts.push(`- Skin Type: ${skinType}`);
  }

  if (score !== undefined && score !== null) {
    parts.push(`- Current Skin Health Score: ${score}/10`);
    if (previousScore !== undefined && previousScore !== null) {
      const diff = score - previousScore;
      const direction = diff >= 0 ? 'improved' : 'declined';
      parts.push(`- Previous Score: ${previousScore}/10 — Score ${direction} by ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}`);
    }
  }

  if (concerns && concerns.length > 0) {
    parts.push(`- Primary Concerns: ${concerns.join(", ")}`);
  }

  if (climate) {
    parts.push(`- Climate/Environment: ${climate}`);
  }

  if (problems && problems.length > 0) {
    parts.push(`- Identified Issues: ${problems.map(p => p.title).join(", ")}`);
  }

  if (avoidIngredients && avoidIngredients.length > 0) {
    parts.push(`- Ingredients to AVOID: ${avoidIngredients.map(i => `${i.name} (${i.reason})`).join(", ")}`);
  }

  if (prescriptionIngredients && prescriptionIngredients.length > 0) {
    parts.push(`- Recommended Ingredients: ${prescriptionIngredients.map(i => `${i.name} (${i.reason})`).join(", ")}`);
  }

  if (parts.length === 1) {
    parts.push("- No skin analysis data available yet. Encourage user to complete a skin scan for personalized advice.");
  }

  return parts.join("\n");
}
