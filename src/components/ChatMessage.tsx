import { cn } from "@/lib/utils";
import { Bot, User, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasPluginFiles, parsePluginFiles, exportPluginAsZip, downloadZip, getPluginName } from "@/lib/pluginExport";
import { toast } from "@/hooks/use-toast";
import { Message, MessageContent, getMessageText } from "@/hooks/useChat";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string | MessageContent[];
  isLoading?: boolean;
}

export function ChatMessage({ role, content, isLoading }: ChatMessageProps) {
  const isAssistant = role === "assistant";
  
  const textContent = typeof content === 'string' ? content : getMessageText({ role, content });
  
  const imageUrl = typeof content !== 'string' 
    ? content.find(c => c.type === 'image_url')?.image_url?.url 
    : null;
  
  const canExport = isAssistant && hasPluginFiles(textContent);

  const handleExport = async () => {
    const files = parsePluginFiles(textContent);
    if (files.length === 0) return;
    
    const pluginName = getPluginName(files);
    const project = { name: pluginName, files, createdAt: Date.now() };
    
    try {
      const blob = await exportPluginAsZip(project);
      downloadZip(blob, `${pluginName}-${Date.now()}.zip`);
      toast({ title: "Plugin exported!", description: `Downloaded ${pluginName}.zip` });
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const displayContent = textContent
    .replace(/===FILE:.+?===\n/g, '\n**📄 ')
    .replace(/===ENDFILE===/g, '\n---');

  return (
    <div
      className={cn(
        "flex gap-4 p-4 animate-fade-in",
        isAssistant ? "bg-secondary/30" : "bg-transparent"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all",
          isAssistant
            ? "bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20"
            : "bg-muted border border-border"
        )}
      >
        {isAssistant ? (
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        ) : (
          <User className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 space-y-3 overflow-hidden min-w-0">
        {imageUrl && (
          <div className="mb-3">
            <img 
              src={imageUrl} 
              alt="Uploaded reference" 
              className="max-h-40 rounded-lg border border-border shadow-lg"
            />
          </div>
        )}
        
        {canExport && (
          <Button onClick={handleExport} size="sm" variant="cyber" className="mb-3 gap-2">
            <Download className="h-4 w-4" />
            Download Plugin ZIP
          </Button>
        )}
        <div className="prose prose-invert max-w-none">
          {isLoading ? (
            <div className="flex items-center gap-2 py-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-xs text-muted-foreground font-mono">Generating...</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/90">
              {displayContent.split("```").map((part, index) => {
                if (index % 2 === 1) {
                  const [lang, ...code] = part.split("\n");
                  return (
                    <pre
                      key={index}
                      className="my-4 overflow-x-auto rounded-lg bg-background/80 border border-border p-4 shadow-inner"
                    >
                      {lang && (
                        <div className="mb-3 text-xs text-primary font-display uppercase tracking-wider">
                          {lang}
                        </div>
                      )}
                      <code className="text-neon-cyan">{code.join("\n")}</code>
                    </pre>
                  );
                }
                return <span key={index}>{part}</span>;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
