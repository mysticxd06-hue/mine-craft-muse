import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

When generating code:
- Always use proper Java conventions
- Include necessary imports
- Add helpful comments
- Use ChatColor for colored messages
- Follow Bukkit/Spigot API best practices

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
