import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Moon, ArrowLeft, Download, Smartphone, Check, Share, MoreVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const ua = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setIsAndroid(/android/.test(ua));

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <nav className="relative z-10 p-6 border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-primary" />
            <span className="font-display text-lg">Install App</span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 mx-auto">
            <Moon className="h-12 w-12 text-primary" />
          </div>

          {isInstalled ? (
            <>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">App Installed</span>
                </div>
                <h1 className="text-3xl font-display text-foreground">You're all set!</h1>
                <p className="text-muted-foreground">
                  Lunar Sky Studios is installed on your device. Open it from your home screen for the best experience.
                </p>
              </div>
              <Button onClick={() => navigate('/')} className="gap-2">
                Continue to App
              </Button>
            </>
          ) : deferredPrompt ? (
            <>
              <div className="space-y-2">
                <h1 className="text-3xl font-display text-foreground">Install Lunar Sky</h1>
                <p className="text-muted-foreground">
                  Install the app on your device for quick access and a better experience. Works offline too!
                </p>
              </div>
              <Button onClick={handleInstall} size="lg" className="gap-2 w-full">
                <Download className="h-5 w-5" />
                Install App
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <h1 className="text-3xl font-display text-foreground">Install Lunar Sky</h1>
                <p className="text-muted-foreground">
                  Add Lunar Sky Studios to your home screen for quick access and an app-like experience.
                </p>
              </div>

              {isIOS && (
                <div className="bg-card border border-border rounded-xl p-6 text-left space-y-4">
                  <h2 className="font-semibold text-foreground">How to install on iPhone/iPad:</h2>
                  <ol className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">1</span>
                      <span>Tap the <Share className="inline h-4 w-4 mx-1" /> Share button in Safari</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">2</span>
                      <span>Scroll down and tap "Add to Home Screen"</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">3</span>
                      <span>Tap "Add" in the top right corner</span>
                    </li>
                  </ol>
                </div>
              )}

              {isAndroid && (
                <div className="bg-card border border-border rounded-xl p-6 text-left space-y-4">
                  <h2 className="font-semibold text-foreground">How to install on Android:</h2>
                  <ol className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">1</span>
                      <span>Tap the <MoreVertical className="inline h-4 w-4 mx-1" /> menu button in Chrome</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">2</span>
                      <span>Tap "Install app" or "Add to Home screen"</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">3</span>
                      <span>Tap "Install" to confirm</span>
                    </li>
                  </ol>
                </div>
              )}

              {!isIOS && !isAndroid && (
                <div className="bg-card border border-border rounded-xl p-6 text-left space-y-4">
                  <h2 className="font-semibold text-foreground">How to install:</h2>
                  <p className="text-sm text-muted-foreground">
                    Look for an install icon in your browser's address bar, or access the browser menu to find "Install app" or "Add to Home Screen" option.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                <Smartphone className="h-5 w-5 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground text-left">
                  The app works offline and loads instantly once installed.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
