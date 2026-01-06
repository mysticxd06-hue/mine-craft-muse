import { Moon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Cosmic background */}
      <div className="fixed inset-0 bg-cosmic pointer-events-none" />
      <div className="fixed inset-0 bg-stars pointer-events-none opacity-50" />
      
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
        
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </nav>

      {/* Content */}
      <main className="flex-1 relative z-10 px-6 py-12 max-w-4xl mx-auto w-full">
        <h1 className="text-4xl font-display text-foreground mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Lunar Sky Studios and its AI-powered plugin generation services, 
              you agree to be bound by these Terms of Service. If you do not agree to these terms, 
              please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Service Description</h2>
            <p>
              Lunar Sky Studios provides an AI assistant named "Lunar" that helps users create 
              Minecraft plugins through natural language descriptions. The generated plugins are 
              provided as-is and users are responsible for testing and validating them before use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. User Accounts</h2>
            <p>
              Users must create an account to access certain features. You are responsible for 
              maintaining the confidentiality of your account credentials and for all activities 
              under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Credits System</h2>
            <p>
              Our service operates on a credits system. Credits are consumed when using AI features. 
              Credits are non-refundable and may expire according to our policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Acceptable Use</h2>
            <p>
              You agree not to use our services to create malicious, harmful, or illegal content. 
              Plugins generated must comply with Minecraft's EULA and applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Intellectual Property</h2>
            <p>
              Users retain ownership of the plugins they create. Lunar Sky Studios retains all 
              rights to the platform, AI models, and underlying technology.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Limitation of Liability</h2>
            <p>
              Lunar Sky Studios is not liable for any damages arising from the use of generated 
              plugins, including but not limited to server crashes, data loss, or security issues.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the service 
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Contact</h2>
            <p>
              For questions about these terms, please contact us through our Discord server.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Lunar Sky Studios
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
