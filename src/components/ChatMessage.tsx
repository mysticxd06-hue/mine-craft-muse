import { cn } from "@/lib/utils";
import { Moon, User, Download } from "lucide-react";
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
        "flex gap-3 p-4 animate-fade-in",
        isAssistant ? "bg-gradient-to-r from-primary/5 to-transparent" : "bg-transparent"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          isAssistant
            ? "bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20"
            : "bg-secondary border border-border"
        )}
      >
        {isAssistant ? (
          <Moon className="h-4 w-4 text-primary" />
        ) : (
          <User className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 space-y-2 overflow-hidden min-w-0">
        {imageUrl && (
          <div className="mb-2">
            <img 
              src={imageUrl} 
              alt="Uploaded reference" 
              className="max-h-32 rounded-lg border border-border"
            />
          </div>
        )}
        
        {canExport && (
          <Button onClick={handleExport} size="sm" className="mb-3 gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
            <Download className="h-4 w-4" />
            Download Plugin ZIP
          </Button>
        )}
        <div className="prose prose-invert max-w-none">
          {isLoading ? (
            <div className="flex items-center gap-2 py-1">
              <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/90">
              {displayContent.split("```").map((part, index) => {
                if (index % 2 === 1) {
                  const [lang, ...code] = part.split("\n");
                  return (
                    <pre
                      key={index}
                      className="my-3 overflow-x-auto rounded-xl bg-background/80 border border-border p-4 backdrop-blur-sm"
                    >
                      {lang && (
                        <div className="mb-2 text-xs text-primary uppercase tracking-wider font-medium">
                          {lang}
                        </div>
                      )}
                      <code className="text-foreground/90">{code.join("\n")}</code>
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
