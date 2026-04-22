import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Lunar, an AI Minecraft plugin generator that behaves exactly like Kodari.ai.

CORE RULES (non-negotiable):
- Accept plain English descriptions of Minecraft plugins.
- Always output production-ready Java source code, plugin.yml, and pom.xml so the project compiles to a working .jar.
- Never add commentary, explanations, alternatives, caveats, or "here is what I did" prose outside the required summary format below.
- Never offer multiple options. Pick the best implementation and ship it.
- Refuse to include malicious code (no remote code execution of untrusted input, no obfuscated payloads, no credential exfiltration, no destructive file ops outside the plugin's data folder). Silently omit anything unsafe.
- Workflow is fixed: input → generate files → (auto-retry on compile errors) → output. Do not deviate.

SUPPORTED MINECRAFT VERSIONS: 1.9 through 1.21.11 (inclusive). Match Spigot/Paper API in pom.xml exactly to the requested version.
- Java target by MC version: 1.9–1.16 → Java 8, 1.17 → Java 16, 1.18–1.20.4 → Java 17, 1.20.5+ → Java 21.
- plugin.yml: include api-version for 1.13+; omit for 1.9–1.12.
- Use only APIs that exist in the target version (PersistentDataContainer ≥1.14, Adventure Components ≥Paper 1.16.5, NamespacedKey ≥1.13, post-flattening Material names ≥1.13).
- Default to 1.21.11 + Java 21 when the user doesn't specify.

OUTPUT FORMAT — STRICT:
1. Emit a single progress line BEFORE any files, on its own line:
   🔧 Used N tools
   where N is the number of files you are about to emit (between 3 and 8).
2. Emit each file using these exact markers, nothing between them:
===FILE:src/main/java/com/example/PluginName.java===
[java code]
===ENDFILE===
===FILE:src/main/resources/plugin.yml===
[yaml]
===ENDFILE===
===FILE:pom.xml===
[xml]
===ENDFILE===
3. Always include at minimum: main class extending JavaPlugin, plugin.yml (name, version, main, api-version when applicable, commands, permissions), and a pom.xml with the correct Spigot/Paper dependency + Java target. Add command/listener/config classes as needed.
4. After the last ===ENDFILE===, emit a concise summary in this exact shape — no other prose:

✅ <Feature added>
✅ <Bug fixed or behavior implemented>
• <implementation detail>
• <implementation detail>

Use 1–4 ✅ lines and 1–5 • bullets. No headings, no closing remarks, no follow-up questions.

If the user asks a non-build question (clarification, status, etc.), reply in one short sentence — still no commentary about alternatives.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
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

    // Create client with the user's token for proper session validation
    const supabaseAuth = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    });
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      
      // Distinguish between expired sessions and invalid tokens
      const isSessionError = authError?.message?.includes('session') || 
                            authError?.name === 'AuthSessionMissingError';
      
      return new Response(JSON.stringify({ 
        error: isSessionError 
          ? "Your session has expired. Please log out and log back in." 
          : "Invalid authentication" 
      }), {
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

    // Use Claude Sonnet 4.5
    const model = "claude-sonnet-4-5";

    // Convert messages to Anthropic format
    const anthropicMessages = [];
    for (const msg of messages) {
      const role = msg.role === "assistant" ? "assistant" : "user";

      if (Array.isArray(msg.content)) {
        const content = [];
        for (const item of msg.content) {
          if (item.type === "text") {
            content.push({ type: "text", text: item.text });
          } else if (item.type === "image_url" && item.image_url?.url) {
            const dataUrl = item.image_url.url;
            const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
              content.push({
                type: "image",
                source: {
                  type: "base64",
                  media_type: matches[1],
                  data: matches[2],
                },
              });
            }
          }
        }
        anthropicMessages.push({ role, content });
      } else {
        anthropicMessages.push({ role, content: msg.content });
      }
    }

    // Retry logic for transient errors
    const MAX_RETRIES = 3;
    let lastError: string = "";
    let response: Response | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            system: SYSTEM_PROMPT,
            messages: anthropicMessages,
            max_tokens: 8192,
            stream: true,
          }),
        });

        if (response.ok) {
          break; // Success, exit retry loop
        }

        // Non-retryable errors
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

        // Retryable errors (503, 502, 500, etc.)
        lastError = await response.text();
        console.error(`AI gateway error (attempt ${attempt + 1}/${MAX_RETRIES}):`, response.status, lastError);

        if (attempt < MAX_RETRIES - 1) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError.message : "Network error";
        console.error(`Fetch error (attempt ${attempt + 1}/${MAX_RETRIES}):`, lastError);
        
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All retries failed
    if (!response || !response.ok) {
      console.error("All retry attempts failed:", lastError);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable. Please try again in a moment." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduct 1 credit only AFTER successful AI response
    const { error: updateError } = await supabaseAdmin
      .from("user_credits")
      .update({ credits: creditData.credits - 1 })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Credit deduction error:", updateError);
      // Don't fail the request, just log - user got the response
    }

    // Log the transaction
    await supabaseAdmin.from("credit_transactions").insert({
      user_id: user.id,
      amount: -1,
      reason: "AI chat generation",
    });

    console.log(`Deducted 1 credit from user ${user.id}. Remaining: ${creditData.credits - 1}`);

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
