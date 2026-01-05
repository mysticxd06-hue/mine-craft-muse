import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function ChatInput({ onSend, disabled, compact }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn(
        "flex gap-2 border-t border-border bg-card/50",
        compact ? "p-2" : "gap-3 p-4"
      )}
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask about Minecraft plugins..."
        disabled={disabled}
        className={cn(
          "flex-1 bg-secondary border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm transition-all",
          compact ? "px-3 py-2" : "px-4 py-3"
        )}
      />
      <Button type="submit" disabled={disabled || !input.trim()} size={compact ? "default" : "lg"}>
        <Send className={compact ? "h-4 w-4" : "h-5 w-5"} />
      </Button>
    </form>
  );
}
