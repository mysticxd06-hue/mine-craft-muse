import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert Minecraft plugin developer assistant. You specialize in creating Bukkit, Spigot, and Paper plugins using Java.

Your capabilities:
- Generate complete, working Java code for Minecraft plugins
- Explain plugin architecture and best practices
- Help with commands, events, items, GUIs, configs, and more
- Provide proper plugin.yml configurations
- Help debug plugin issues
- Analyze images to understand plugin design requirements

When generating code:
- Always use proper Java conventions
- Include necessary imports
- Add helpful comments
- Use ChatColor for colored messages
- Follow Bukkit/Spigot API best practices

When a user sends an image:
- Analyze the image to understand what kind of plugin or feature they want
- If it's a GUI design, create an inventory GUI that matches it
- If it's a game mechanic, implement that mechanic
- If it's unclear, ask for clarification

When a user asks you to create a complete plugin or says they want to "compile" or "export" their plugin, structure your response with these special markers:

For plugin files, wrap each file like this:
===FILE:src/main/java/com/example/PluginName.java===
[java code here]
===ENDFILE===

===FILE:src/main/resources/plugin.yml===
[plugin.yml content]
===ENDFILE===

===FILE:pom.xml===
[maven pom.xml content]
===ENDFILE===

Always include:
1. Main plugin class extending JavaPlugin
2. plugin.yml with name, version, main, api-version, commands, and permissions
3. pom.xml with proper Spigot dependency
4. Any additional classes needed (commands, listeners, etc.)

Be helpful, concise, and focus on creating working, production-ready code.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get authorization header (user access token)
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token || token.split('.').length !== 3) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Authenticated user: ${user.id}`);

    // Create service role client for credit operations (bypasses RLS)
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Check user credits
    const { data: creditData, error: creditError } = await supabaseAdmin
      .from("user_credits")
      .select("credits")
      .eq("user_id", user.id)
      .single();

    if (creditError) {
      console.error("Credit check error:", creditError);
      return new Response(JSON.stringify({ error: "Failed to check credits" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!creditData || creditData.credits <= 0) {
      return new Response(JSON.stringify({ error: "Insufficient credits. Please contact an admin for more." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduct 1 credit
    const { error: updateError } = await supabaseAdmin
      .from("user_credits")
      .update({ credits: creditData.credits - 1 })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Credit deduction error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to deduct credit" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the transaction
    await supabaseAdmin.from("credit_transactions").insert({
      user_id: user.id,
      amount: -1,
      reason: "AI chat generation",
    });

    console.log(`Deducted 1 credit from user ${user.id}. Remaining: ${creditData.credits - 1}`);

    // Check if any message contains an image
    const hasImage = messages.some((m: any) => 
      Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image_url')
    );

    // Use a vision-capable model if images are present
    const model = hasImage ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
