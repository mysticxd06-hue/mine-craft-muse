import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, Send, ArrowRight, Sparkles, Layers, Coins, Shield, LogIn, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, isAdmin, loading } = useAuthContext();
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/auth");
      return;
    }
    if (inputValue.trim()) {
      navigate("/editor", { state: { initialPrompt: inputValue.trim() } });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Cosmic background */}
      <div className="fixed inset-0 bg-cosmic pointer-events-none" />
      <div className="fixed inset-0 bg-stars pointer-events-none opacity-50" />
      
      {/* Floating orbs */}
      <div className="fixed top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="fixed bottom-20 right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      <div className="fixed top-1/2 left-1/2 w-96 h-96 bg-lunar-pink/5 rounded-full blur-3xl animate-pulse-slow" />
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Moon className="h-7 w-7 text-primary" />
            <div className="absolute inset-0 blur-md bg-primary/50 animate-pulse-slow" />
          </div>
          <span className="font-display text-xl tracking-wide text-foreground">
            Lunar Sky Studios
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/admin')}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Button>
          )}
          
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg border border-border">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">{profile?.credits ?? 0}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm text-muted-foreground hidden md:block">
                  {profile?.display_name || profile?.email}
                </span>
              </div>
              
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/auth')}
              className="gap-2"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full border border-border mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">AI-Powered Plugin Generation</span>
          </div>
          
          {/* Greeting */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display text-foreground mb-4 leading-tight">
            Hey, I'm{" "}
            <span className="text-gradient">Lunar</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-xl mx-auto">
            Your AI companion for creating Minecraft plugins. 
            <span className="text-foreground"> Just describe what you want.</span>
          </p>

          {/* Input Card */}
          <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5 shadow-2xl card-hover">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={user ? "Describe the plugin you want to create..." : "Sign in to start creating plugins..."}
                rows={3}
                disabled={!user}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none resize-none text-lg disabled:opacity-50"
              />
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg text-sm text-muted-foreground">
                    <Layers className="h-4 w-4 text-primary" />
                    Spigot Plugin
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={!user || !inputValue.trim()}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all gap-2 rounded-xl px-6"
                >
                  {user ? (
                    <>
                      Create
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Sign In to Start
                      <LogIn className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-10 text-sm">
            <button 
              onClick={() => navigate("/editor")}
              className="flex items-center gap-2 px-4 py-2 bg-secondary/30 hover:bg-secondary/50 border border-border rounded-lg text-muted-foreground hover:text-foreground transition-all"
            >
              <Layers className="h-4 w-4" />
              Open Editor
            </button>
            
            {user && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg text-primary">
                <Coins className="h-4 w-4" />
                <span>{profile?.credits ?? 0} credits available</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Discord</a>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © 2025 Lunar Sky Studios
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
