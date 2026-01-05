import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

export function ChatMessage({ role, content, isLoading }: ChatMessageProps) {
  const isAssistant = role === "assistant";

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
        <div className="prose prose-invert max-w-none">
          {isLoading ? (
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {content.split("```").map((part, index) => {
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
