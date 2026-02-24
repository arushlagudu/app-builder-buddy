import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { userId } = await req.json();
    if (!userId) throw new Error("userId is required");

    // Get user's latest analysis for personalization
    const { data: analysis } = await supabaseClient
      .from("analysis_history")
      .select("skin_type, concerns, score, problems, avoid_ingredients, prescription_ingredients, climate, pollution")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let prompt: string;

    if (analysis) {
      const avoidNames = (analysis.avoid_ingredients as any[])?.map((i: any) => i.name).join(', ') || '';
      const rxNames = (analysis.prescription_ingredients as any[])?.map((i: any) => i.name).join(', ') || '';
      
      prompt = `Generate a short, actionable daily skincare tip for someone with ${analysis.skin_type || 'normal'} skin${
        analysis.concerns?.length ? ` concerned about ${analysis.concerns.join(', ')}` : ''
      }${analysis.score ? ` with a skin health score of ${analysis.score}/10` : ''}${
        analysis.climate ? ` living in a ${analysis.climate} climate` : ''
      }${avoidNames ? `. They should AVOID these ingredients: ${avoidNames}` : ''}${
        rxNames ? `. Recommended ingredients for them: ${rxNames}` : ''
      }. 
      
      Return JSON with "title" (max 8 words, catchy) and "content" (max 2 sentences, specific and actionable). No markdown.`;
    } else {
      prompt = `Generate a short, universal daily skincare tip that anyone can use. Return JSON with "title" (max 8 words, catchy) and "content" (max 2 sentences, specific and actionable). No markdown.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a dermatology expert. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) throw new Error(`AI API error: ${response.status}`);

    const aiData = await response.json();
    const text = aiData.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in AI response");
    
    const tipData = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(tipData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
