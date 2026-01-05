import { useNavigate } from "react-router-dom";
import { FeatureCard } from "@/components/FeatureCard";
import { Button } from "@/components/ui/button";
import { Code2, Blocks, Zap, Book, Github, ArrowRight, Sparkles, Terminal, Cpu, Box } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const EXAMPLE_PROMPTS = [
  "Teleportation system with cooldowns",
  "Custom enchantments with particle effects",
  "Player statistics dashboard",
  "Full economy with shops & banks",
];

const Index = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [isHovered, setIsHovered] = useState<number | null>(null);

  const handleExampleClick = (prompt: string) => {
    toast({
      title: "Initializing...",
      description: "Loading plugin workspace",
    });
    navigate("/editor", { state: { initialPrompt: prompt } });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      navigate("/editor", { state: { initialPrompt: inputValue.trim() } });
    }
  };

  return (
    <div className="min-h-screen bg-grid relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[150px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/50 blur-lg" />
            <div className="relative h-10 w-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Blocks className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <span className="font-display font-bold text-xl tracking-wider text-foreground">
            CRAFTSMAN
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </Button>
          <Button variant="cyber" size="sm" onClick={() => navigate("/editor")}>
            Launch Editor
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 pt-10">
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm border border-primary/30 rounded-full mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4 text-primary animate-glow-pulse" />
            <span className="text-sm text-primary font-mono">AI-Powered Plugin Generation</span>
          </div>

          {/* Main heading */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black text-foreground mb-6 leading-[0.9] tracking-tight animate-fade-in" style={{ animationDelay: "100ms" }}>
            <span className="block">BUILD</span>
            <span className="block gradient-text text-glow-cyan">MINECRAFT</span>
            <span className="block">PLUGINS</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 font-body leading-relaxed animate-fade-in" style={{ animationDelay: "200ms" }}>
            Describe your vision. Watch it become code. Deploy to your server in minutes with AI-generated Bukkit, Spigot, and Paper plugins.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <Button variant="hero" size="xl" onClick={() => navigate("/editor")}>
              Start Creating
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="glass" size="xl" asChild>
              <a href="#features">
                Explore Features
              </a>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 animate-fade-in" style={{ animationDelay: "400ms" }}>
            {[
              { label: "Lines Generated", value: "500K+" },
              { label: "Plugins Created", value: "10K+" },
              { label: "Active Users", value: "5K+" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-display font-bold text-3xl md:text-4xl gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-mono">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-muted-foreground font-mono">SCROLL</span>
          <div className="w-px h-8 bg-gradient-to-b from-primary to-transparent" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/20 border border-accent/30 rounded-full mb-6">
              <Cpu className="h-3 w-3 text-accent" />
              <span className="text-xs text-accent font-mono uppercase tracking-wider">Capabilities</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-body text-lg">
              From concept to compiled plugin — the complete toolkit for Minecraft developers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Code2}
              title="Code Generation"
              description="Complete Java plugins with commands, events, configuration, and persistence."
              accentColor="cyan"
            />
            <FeatureCard
              icon={Blocks}
              title="Import & Export"
              description="Load existing plugins as ZIP, export Maven-ready projects."
              accentColor="magenta"
            />
            <FeatureCard
              icon={Zap}
              title="Instant Compile"
              description="GitHub Actions integration for one-click JAR compilation."
              accentColor="purple"
            />
            <FeatureCard
              icon={Book}
              title="AI Assistant"
              description="Debug, explain, or enhance any plugin code with intelligent help."
              accentColor="green"
            />
          </div>
        </div>
      </section>

      {/* Create Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-8 md:p-12 bg-card/30 backdrop-blur-xl border border-border rounded-2xl overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-grid-dense opacity-30" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-[80px]" />
            
            <div className="relative z-10">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full mb-6">
                  <Terminal className="h-3 w-3 text-primary" />
                  <span className="text-xs text-primary font-mono uppercase tracking-wider">Create</span>
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
                  Start Building
                </h2>
                <p className="text-muted-foreground font-body">
                  Describe your plugin idea or try one of our examples
                </p>
              </div>

              {/* Example prompts */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {EXAMPLE_PROMPTS.map((prompt, index) => (
                  <button
                    key={prompt}
                    onClick={() => handleExampleClick(prompt)}
                    onMouseEnter={() => setIsHovered(index)}
                    onMouseLeave={() => setIsHovered(null)}
                    className={`relative p-4 text-left bg-secondary/50 border rounded-lg transition-all duration-300 font-mono text-sm ${
                      isHovered === index 
                        ? "border-primary text-primary shadow-[0_0_20px_hsl(175_100%_50%/0.2)]" 
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Box className={`h-3 w-3 mb-2 transition-colors ${isHovered === index ? "text-primary" : "text-muted-foreground"}`} />
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Describe your Minecraft plugin idea..."
                    className="w-full bg-background/50 border border-border rounded-xl px-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Button type="submit" variant="hero" size="default" disabled={!inputValue.trim()}>
                      Generate
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Blocks className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-foreground tracking-wide">CRAFTSMAN</span>
          </div>
          
          <p className="text-sm text-muted-foreground font-body">
            Built for the Minecraft developer community
          </p>
          
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
