import { useNavigate } from "react-router-dom";
import { FeatureCard } from "@/components/FeatureCard";
import { Button } from "@/components/ui/button";
import { Code2, Blocks, Zap, Book, Github, ArrowDown, Download, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const EXAMPLE_PROMPTS = [
  "Create a complete teleport plugin",
  "Make a custom enchantment plugin",
  "Build a player stats tracker",
  "Create a full economy plugin",
];

const Index = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");

  const handleExampleClick = (prompt: string) => {
    toast({
      title: "Opening editor...",
      description: "Starting your plugin project!",
    });
    navigate("/editor", { state: { initialPrompt: prompt } });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      navigate("/editor", { state: { initialPrompt: inputValue.trim() } });
    }
  };

  const scrollToChat = () => {
    document.getElementById("chat-section")?.scrollIntoView({ behavior: "smooth" });
  };

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
              Describe what plugin you want to create, or try one of these examples
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
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

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Describe your Minecraft plugin idea..."
                className="flex-1 bg-card border border-border rounded-lg px-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm transition-all"
              />
              <Button type="submit" variant="hero" disabled={!inputValue.trim()}>
                Start Building
              </Button>
            </div>
          </form>
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
