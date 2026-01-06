import { Moon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
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
        <h1 className="text-4xl font-display text-foreground mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Account information (email, display name)</li>
              <li>Plugin descriptions and generated content</li>
              <li>Usage data and interaction logs</li>
              <li>Device information for security purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Provide and improve our AI plugin generation services</li>
              <li>Process your requests and manage your account</li>
              <li>Send you updates and important notices</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Data Storage and Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information. 
              Your data is stored on secure servers and encrypted in transit. However, no method 
              of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Sharing</h2>
            <p>
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Service providers who assist in operating our platform</li>
              <li>Law enforcement when required by law</li>
              <li>Other users (only for public projects you choose to share)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Your Rights</h2>
            <p>
              You have the right to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your projects and data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Cookies</h2>
            <p>
              We use essential cookies to maintain your session and preferences. 
              We do not use tracking cookies for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Children's Privacy</h2>
            <p>
              Our services are not intended for children under 13. We do not knowingly collect 
              information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any 
              significant changes through our platform or by email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy, please contact us through our 
              Discord server.
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

export default Privacy;
