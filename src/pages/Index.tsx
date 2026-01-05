import { useState } from "react";
import { ChatWindow } from "@/components/ChatWindow";
import { FeatureCard } from "@/components/FeatureCard";
import { Button } from "@/components/ui/button";
import { Code2, Blocks, Zap, Book, Github, ArrowDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const EXAMPLE_PROMPTS = [
  "Create a simple teleport command",
  "How do I listen for player events?",
  "Make a custom item with abilities",
  "Set up a config.yml file",
];

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (content: string) => {
    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response for now - will be replaced with actual AI
    setTimeout(() => {
      const assistantMessage: Message = {
        role: "assistant",
        content: generateMockResponse(content),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleExampleClick = (prompt: string) => {
    handleSend(prompt);
    toast({
      title: "Example loaded",
      description: "Check the chat for the response!",
    });
  };

  const scrollToChat = () => {
    document.getElementById("chat-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-grid">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-full mb-8 animate-fade-in">
            <Blocks className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-mono">Powered by AI</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight animate-fade-in" style={{ animationDelay: "100ms" }}>
            Craft Minecraft Plugins
            <span className="block text-primary text-glow">Like Never Before</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "200ms" }}>
            Your AI-powered companion for creating Bukkit, Spigot, and Paper plugins. 
            From simple commands to complex systems — let's build together.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "300ms" }}>
            <Button variant="hero" onClick={scrollToChat}>
              Start Crafting
              <ArrowDown className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="xl" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5" />
                View Examples
              </a>
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <ArrowDown className="h-6 w-6 text-muted-foreground" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From beginner tutorials to advanced plugin architecture — get expert guidance instantly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Code2}
              title="Code Generation"
              description="Get working Java code snippets for commands, events, items, and more."
            />
            <FeatureCard
              icon={Blocks}
              title="API Knowledge"
              description="Bukkit, Spigot, Paper, and all their quirks — explained simply."
            />
            <FeatureCard
              icon={Zap}
              title="Best Practices"
              description="Learn performance optimization and proper plugin architecture."
            />
            <FeatureCard
              icon={Book}
              title="Documentation"
              description="Access examples and explanations tailored to your skill level."
            />
          </div>
        </div>
      </section>

      {/* Chat Section */}
      <section id="chat-section" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ask Your Plugin Question
            </h2>
            <p className="text-muted-foreground mb-6">
              Try one of these examples or ask your own question
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleExampleClick(prompt)}
                  className="px-4 py-2 bg-secondary border border-border rounded text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all font-mono"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <ChatWindow
            messages={messages}
            onSend={handleSend}
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Blocks className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold text-foreground">Plugin Craftsman</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built for the Minecraft developer community
          </p>
        </div>
      </footer>
    </div>
  );
};

// Mock response generator - will be replaced with actual AI
function generateMockResponse(input: string): string {
  const lower = input.toLowerCase();
  
  if (lower.includes("teleport")) {
    return `Here's a simple teleport command for your plugin:

\`\`\`java
public class TeleportCommand implements CommandExecutor {
    @Override
    public boolean onCommand(CommandSender sender, Command cmd, String label, String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage("Only players can use this command!");
            return true;
        }
        
        Player player = (Player) sender;
        
        if (args.length < 3) {
            player.sendMessage(ChatColor.RED + "Usage: /tp <x> <y> <z>");
            return true;
        }
        
        try {
            double x = Double.parseDouble(args[0]);
            double y = Double.parseDouble(args[1]);
            double z = Double.parseDouble(args[2]);
            
            Location loc = new Location(player.getWorld(), x, y, z);
            player.teleport(loc);
            player.sendMessage(ChatColor.GREEN + "Teleported successfully!");
        } catch (NumberFormatException e) {
            player.sendMessage(ChatColor.RED + "Invalid coordinates!");
        }
        
        return true;
    }
}
\`\`\`

Don't forget to register this command in your \`plugin.yml\` and in your main class!`;
  }
  
  if (lower.includes("event")) {
    return `To listen for player events, you'll need to implement the Listener interface. Here's an example:

\`\`\`java
public class PlayerListener implements Listener {
    
    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        event.setJoinMessage(ChatColor.GREEN + player.getName() + " has joined!");
        player.sendMessage(ChatColor.GOLD + "Welcome to the server!");
    }
    
    @EventHandler(priority = EventPriority.HIGH)
    public void onPlayerDamage(EntityDamageEvent event) {
        if (event.getEntity() instanceof Player) {
            Player player = (Player) event.getEntity();
            // Custom damage handling
        }
    }
}
\`\`\`

Register in your main class:
\`\`\`java
getServer().getPluginManager().registerEvents(new PlayerListener(), this);
\`\`\``;
  }
  
  if (lower.includes("item") || lower.includes("custom")) {
    return `Here's how to create a custom item with special abilities:

\`\`\`java
public ItemStack createMagicSword() {
    ItemStack sword = new ItemStack(Material.DIAMOND_SWORD);
    ItemMeta meta = sword.getItemMeta();
    
    meta.setDisplayName(ChatColor.LIGHT_PURPLE + "✦ Enchanted Blade");
    
    List<String> lore = new ArrayList<>();
    lore.add(ChatColor.GRAY + "A blade forged in magic");
    lore.add("");
    lore.add(ChatColor.YELLOW + "Right-click to cast lightning!");
    meta.setLore(lore);
    
    meta.addEnchant(Enchantment.DAMAGE_ALL, 5, true);
    meta.addItemFlags(ItemFlag.HIDE_ENCHANTS);
    
    sword.setItemMeta(meta);
    return sword;
}
\`\`\`

Use NBT tags or PersistentDataContainer for custom item identification!`;
  }
  
  if (lower.includes("config")) {
    return `Here's how to set up a config.yml properly:

**config.yml:**
\`\`\`yaml
settings:
  prefix: "&6[MyPlugin] &r"
  debug-mode: false
  
messages:
  welcome: "&aWelcome to the server!"
  goodbye: "&7Goodbye, {player}!"
  
features:
  enable-teleport: true
  teleport-cooldown: 30
\`\`\`

**Java code to load it:**
\`\`\`java
public class MyPlugin extends JavaPlugin {
    
    @Override
    public void onEnable() {
        // Creates config.yml if it doesn't exist
        saveDefaultConfig();
        
        // Access values
        String prefix = getConfig().getString("settings.prefix");
        boolean debug = getConfig().getBoolean("settings.debug-mode");
        int cooldown = getConfig().getInt("features.teleport-cooldown");
        
        // Reload config command
        reloadConfig();
    }
}
\`\`\`

Use \`ConfigurationSection\` for nested values!`;
  }
  
  return `I can help you with that! Here are some things I can assist with:

• **Commands** - Creating custom commands with permissions
• **Events** - Listening to player, block, and entity events
• **Items** - Custom items with special abilities
• **Config** - Setting up configuration files
• **Database** - Storing player data with MySQL or SQLite
• **NPCs** - Creating custom entities and mobs
• **GUIs** - Inventory-based menus and interfaces

What specific aspect would you like to explore? Just ask and I'll provide code examples and explanations!`;
}

export default Index;
