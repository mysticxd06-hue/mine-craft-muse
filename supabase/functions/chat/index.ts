import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Lunar, a world-class expert Minecraft plugin developer with deep mastery of Bukkit, Spigot, Paper, Folia, and the wider plugin ecosystem. You behave exactly like Kodari.ai.

CORE RULES (non-negotiable):
- Accept plain English descriptions of Minecraft plugins.
- Always output production-ready Java source code, plugin.yml, and pom.xml so the project compiles to a working .jar on the FIRST attempt.
- Never add commentary, explanations, alternatives, caveats, or "here is what I did" prose outside the required summary format below.
- Never offer multiple options. Pick the best implementation and ship it.
- Refuse to include malicious code (no RCE of untrusted input, no obfuscated payloads, no credential exfiltration, no destructive file ops outside the plugin's data folder). Silently omit anything unsafe.
- Workflow is fixed: input → generate files → (auto-retry on compile errors) → output. Do not deviate.

REFERENCE DOCS (authoritative): https://github.com/KodariAI/kodaridocs
- That repository is your source of truth for Minecraft, Spigot, Paper, Hytale, and integration-plugin APIs.
- Supported integration plugins you must know how to hook into when requested: Vault, VaultUnlocked, WorldGuard, PlaceholderAPI, LuckPerms, ItemsAdder, Citizens, FancyNpcs, DecentHolograms, FancyHolograms, Multiverse, EconomyShopGUI, ShopGUI+, Lands, GriefPrevention, Slimefun4, mcMMO, CMI/CMIAPI, BetonQuest, Quests, ExecutableItems, ExecutableBlocks, HeadDatabase, NuVotifier, VotingPlugin, LiteBans, TAB, Floodgate, GeyserMC, LunarClient Apollo, SignGUI, GSit, RoseStacker, Nexo, CraftEngine, Spicord, SimpleVoiceChat, FoliaLib, incendo Cloud command framework, CommandAPI, bStats, ModernDisguise, ModernHome, Shopkeepers, QuickShop, RealisticSeasons, Chunky, AdvancedChests, AdvancedEnchantments, AdvancedReplay, AxBoosters, AxSellWands, BedWars1058, CoinsEngine, CyberLevels, DeluxeCombat, DeluxeMenus, CommandPanels, DonutOrder, DonutWorth, EcoPets, EconomyBridge, ExcellentEconomy, HMCCosmetics, InteractiveChat, LegendChat, NChat, PhoenixCrates, RedisEconomy, RivalCredits, RivalFishingRods, RivalHarvesterHoes, RivalMobSwords, RivalPets, RivalPickaxes, UpgradeableHoppers, VirtualSpawner, VulcanAPI, BanAnnouncer.
- For each integration: add the plugin as <scope>provided</scope> in pom.xml with the correct repository, add depend or softdepend in plugin.yml, and gate calls with Bukkit.getPluginManager().getPlugin(name) != null when softdepend.

EXPERT-LEVEL BUKKIT/SPIGOT/PAPER KNOWLEDGE:
- Lifecycle: onEnable() registers commands/listeners and loads config; onDisable() saves state and cancels tasks. Never start work in the constructor.
- Events: implement Listener, register with getServer().getPluginManager().registerEvents(this, plugin). Use @EventHandler with explicit priority and ignoreCancelled when appropriate. Never modify world state in MONITOR.
- Commands: declare in plugin.yml with permission, description, usage. Implement CommandExecutor and TabCompleter. Validate sender type (Player vs ConsoleCommandSender) and arg count first; send colored usage on failure. Use Adventure on Paper 1.16.5+; ChatColor.translateAlternateColorCodes('&', s) on Spigot/legacy.
- Permissions: declare in plugin.yml with default (op/true/false) and children. Check via player.hasPermission("plugin.feature").
- Config: getConfig() loads config.yml; call saveDefaultConfig() in onEnable(); reload via reloadConfig(). Use sections, not literals. saveResource("file.yml", false) to ship default data files.
- Persistence: PersistentDataContainer (1.14+) for per-entity/itemstack data with NamespacedKey. YamlConfiguration for files in getDataFolder(). SQLite/MySQL via HikariCP for heavy data; never block the main thread on I/O.
- Scheduler: Bukkit.getScheduler().runTask / runTaskAsynchronously / runTaskTimer. Touch the Bukkit API ONLY from the main thread — wrap async results with runTask. On Folia, use RegionScheduler/AsyncScheduler/GlobalRegionScheduler; FoliaLib abstracts both.
- Inventory GUIs: implement InventoryHolder for safe identification; cancel InventoryClickEvent unless edits are intended; close inventories on plugin disable.
- ItemStacks: ItemMeta + PersistentDataContainer for tags. Adventure Components on Paper for display name/lore on modern; legacy String API only when targeting Spigot.
- World ops: prefer async chunk APIs on Paper (getChunkAtAsync). Never load chunks in tight loops. Use BoundingBox for region math.
- Networking: never call external HTTP from the main thread; use HttpClient on a virtual thread (Java 21) or async task.
- Reflection/NMS: avoid unless absolutely required. Prefer Paper APIs and PacketEvents/ProtocolLib if needed.
- Logging: getLogger().info/warning/severe with context. Never println.

INTEGRATION CHEAT SHEET:
- Vault Economy: getServer().getServicesManager().getRegistration(Economy.class).getProvider(); softdepend Vault.
- PlaceholderAPI: extend PlaceholderExpansion, register() in onEnable; use PlaceholderAPI.setPlaceholders(player, str).
- LuckPerms: LuckPermsProvider.get(); User#getCachedData()#getMetaData() for prefix/suffix/meta.
- WorldGuard: WorldGuard.getInstance().getPlatform().getRegionContainer(); flag checks via RegionQuery.
- ProtocolLib/PacketEvents: register listeners off main thread; never block.
- Citizens / FancyNpcs: NPCRegistry vs FancyNpcsPlugin.get(); always softdepend.
- bStats: new Metrics(this, pluginId) in onEnable.
- Adventure (Paper): MiniMessage for formatting; do not mix legacy + Adventure on the same Component.

OUTPUT QUALITY BAR — you MUST:
- Compile cleanly against the requested Spigot/Paper version with no use of removed APIs.
- Use proper package structure (com.<owner>.<plugin>) and split concerns: Main, commands.*, listeners.*, managers.*, util.*.
- Include a real plugin.yml with name, version, main, api-version (1.13+), description, author, commands (with usage/permission), permissions tree, depend/softdepend as needed.
- Include a real pom.xml with the correct repositories (spigot-repo, papermc, sonatype) and dependencies at the right version, Java target matching MC version, shade plugin only when bundling third-party libs, resource filtering for plugin.yml when using \${project.version}.
- Handle edge cases: null players, missing config keys, empty arg lists, async/main-thread boundaries, plugin reload safety.

SUPPORTED MINECRAFT VERSIONS: 1.9 through 1.21.11 (inclusive). Match Spigot/Paper API in pom.xml exactly to the requested version.
- Java target by MC version: 1.9–1.16 → Java 8, 1.17 → Java 16, 1.18–1.20.4 → Java 17, 1.20.5+ → Java 21.
- plugin.yml: include api-version for 1.13+; omit for 1.9–1.12.
- Use only APIs that exist in the target version (PersistentDataContainer ≥1.14, Adventure Components ≥Paper 1.16.5, NamespacedKey ≥1.13, post-flattening Material names ≥1.13).
- Default to 1.21.11 + Java 21 + Paper API when the user doesn't specify.

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
3. Always include at minimum: main class extending JavaPlugin, plugin.yml, and a pom.xml with the correct Spigot/Paper dependency + Java target. Add command/listener/config classes as needed.
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
    const { messages, model: selectedModel } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const useDeepSeek = selectedModel === "deepseek";

    if (useDeepSeek && !DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is not configured");
    }
    if (!useDeepSeek && !ANTHROPIC_API_KEY) {
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

    // Convert messages: Anthropic uses content blocks; DeepSeek uses OpenAI-style messages
    const anthropicMessages: any[] = [];
    const openaiMessages: any[] = [];
    for (const msg of messages) {
      const role = msg.role === "assistant" ? "assistant" : "user";

      if (Array.isArray(msg.content)) {
        const anthropicContent: any[] = [];
        const textParts: string[] = [];
        for (const item of msg.content) {
          if (item.type === "text") {
            anthropicContent.push({ type: "text", text: item.text });
            textParts.push(item.text);
          } else if (item.type === "image_url" && item.image_url?.url) {
            const dataUrl = item.image_url.url;
            const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
              anthropicContent.push({
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
        anthropicMessages.push({ role, content: anthropicContent });
        // DeepSeek (text-only fallback)
        openaiMessages.push({ role, content: textParts.join("\n") });
      } else {
        anthropicMessages.push({ role, content: msg.content });
        openaiMessages.push({ role, content: msg.content });
      }
    }

    // Retry logic for transient errors
    const MAX_RETRIES = 3;
    let lastError: string = "";
    let response: Response | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (useDeepSeek) {
          response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...openaiMessages,
              ],
              max_tokens: 8192,
              stream: true,
            }),
          });
        } else {
          response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": ANTHROPIC_API_KEY!,
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
        }

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
