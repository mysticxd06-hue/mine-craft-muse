import { useChat } from "@/hooks/useChat";
import { ChatWindow } from "@/components/ChatWindow";
import { PluginActions } from "@/components/PluginActions";
import { FeatureCard } from "@/components/FeatureCard";
import { Button } from "@/components/ui/button";
import { Code2, Blocks, Zap, Book, Github, ArrowDown, Download, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const EXAMPLE_PROMPTS = [
  "Create a complete teleport plugin",
  "Make a custom enchantment plugin",
  "Build a player stats tracker",
  "Create a full economy plugin",
];

const Index = () => {
  const { messages, isLoading, sendMessage, addMessage } = useChat();

  const handleExampleClick = (prompt: string) => {
    sendMessage(prompt);
    toast({
      title: "Generating plugin...",
      description: "The AI is creating your plugin!",
    });
  };

  const scrollToChat = () => {
    document.getElementById("chat-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleImport = (formattedContent: string) => {
    addMessage({ role: "user", content: "I imported a plugin. Here are the files:" });
    addMessage({ role: "assistant", content: formattedContent + "\n\nI've loaded your plugin! What would you like me to help you with? I can:\n- Explain how the code works\n- Add new features\n- Fix bugs or improve the code\n- Help you compile and export it" });
  };

  const lastAssistantMessage = [...messages].reverse().find(m => m.role === "assistant")?.content;

  return (
    <div className="min-h-screen bg-grid">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-full mb-8 animate-fade-in">
            <Blocks className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-mono">AI-Powered Plugin Creator</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight animate-fade-in" style={{ animationDelay: "100ms" }}>
            Craft Minecraft Plugins
            <span className="block text-primary text-glow">Like Never Before</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "200ms" }}>
            Create complete Bukkit, Spigot, and Paper plugins with AI. 
            Import existing plugins, generate code, and export ready-to-compile projects.
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

          <div className="flex justify-center gap-6 mt-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              Import .zip plugins
            </div>
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" />
              Export ready-to-compile
            </div>
          </div>
        </div>

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
              description="Get complete Java plugins with commands, events, configs, and more."
            />
            <FeatureCard
              icon={Blocks}
              title="Import & Export"
              description="Load existing plugins as ZIP files and export your creations."
            />
            <FeatureCard
              icon={Zap}
              title="Instant Compile"
              description="Get Maven-ready projects you can build with a single command."
            />
            <FeatureCard
              icon={Book}
              title="Smart Assistance"
              description="Explain, debug, or enhance any plugin code with AI help."
            />
          </div>
        </div>
      </section>

      {/* Chat Section */}
      <section id="chat-section" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Create Your Plugin
            </h2>
            <p className="text-muted-foreground mb-6">
              Ask the AI to generate a complete plugin, or try one of these examples
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleExampleClick(prompt)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-secondary border border-border rounded text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all font-mono disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <PluginActions 
              lastAssistantMessage={lastAssistantMessage}
              onImport={handleImport}
            />
          </div>

          <ChatWindow
            messages={messages}
            onSend={sendMessage}
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

export default Index;
