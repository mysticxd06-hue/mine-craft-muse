import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, Send, ArrowRight, Sparkles, FolderOpen, Layers } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      navigate("/editor", { state: { initialPrompt: inputValue.trim() } });
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Subtle top glow */}
      <div className="absolute inset-0 bg-glow-top pointer-events-none" />
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-primary" />
          <span className="font-display text-lg tracking-wide text-foreground">
            LUNAR SKY STUDIOS
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Documentation
          </button>
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Examples
          </button>
          <Button variant="outline" size="sm">
            Sign in
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
        <div className="text-center max-w-2xl mx-auto animate-fade-in-up">
          {/* Greeting */}
          <h1 className="text-4xl md:text-5xl font-display text-foreground mb-4">
            Hi! I'm <span className="text-primary">Lunar</span> :)
          </h1>
          
          <p className="text-lg text-muted-foreground mb-12">
            Let's turn your idea into <span className="text-primary">reality</span>.
          </p>

          {/* Input Card */}
          <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Lunar to create a plugin about..."
                rows={3}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none resize-none text-base"
              />
              
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <button type="button" className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg text-sm text-muted-foreground">
                    <Layers className="h-3.5 w-3.5" />
                    Java Plugin
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!inputValue.trim()}
                  className="rounded-lg"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>

          {/* Quick Links */}
          <div className="flex items-center justify-center gap-6 mt-8 text-sm">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <FolderOpen className="h-4 w-4" />
              Explore Community Plugins
            </button>
            <span className="text-border">•</span>
            <button 
              onClick={() => navigate("/editor")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Layers className="h-4 w-4" />
              Your Projects
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Discord</a>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © 2025 Lunar Sky Studios • Not affiliated with Mojang, Microsoft, or Discord
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
