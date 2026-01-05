import { cn } from "@/lib/utils";
import { Bot, User, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasPluginFiles, parsePluginFiles, exportPluginAsZip, downloadZip, getPluginName } from "@/lib/pluginExport";
import { toast } from "@/hooks/use-toast";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

export function ChatMessage({ role, content, isLoading }: ChatMessageProps) {
  const isAssistant = role === "assistant";
  const canExport = isAssistant && hasPluginFiles(content);

  const handleExport = async () => {
    const files = parsePluginFiles(content);
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

  // Clean content for display (remove file markers)
  const displayContent = content
    .replace(/===FILE:.+?===\n/g, '\n**📄 ')
    .replace(/===ENDFILE===/g, '\n---');

  return (
    <div
      className={cn(
        "flex gap-3 p-4 animate-fade-in",
        isAssistant ? "bg-secondary/50" : "bg-transparent"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded",
          isAssistant
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isAssistant ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        {canExport && (
          <Button onClick={handleExport} size="sm" className="mb-2 gap-2">
            <Download className="h-4 w-4" />
            Download Plugin ZIP
          </Button>
        )}
        <div className="prose prose-invert max-w-none">
          {isLoading ? (
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {displayContent.split("```").map((part, index) => {
                if (index % 2 === 1) {
                  const [lang, ...code] = part.split("\n");
                  return (
                    <pre
                      key={index}
                      className="my-3 overflow-x-auto rounded bg-obsidian p-4 border border-border"
                    >
                      {lang && (
                        <div className="mb-2 text-xs text-muted-foreground uppercase tracking-wider">
                          {lang}
                        </div>
                      )}
                      <code className="text-diamond">{code.join("\n")}</code>
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
