import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Moon } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWindowProps {
  messages: Message[];
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatWindow({ messages, onSend, isLoading }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-[600px] max-h-[70vh] bg-card border border-border rounded-lg overflow-hidden shadow-2xl">
      <div className="flex items-center gap-3 p-4 border-b border-border bg-secondary/50">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-primary text-primary-foreground">
          <Moon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Lunar</h3>
          <p className="text-xs text-muted-foreground">AI-powered Minecraft plugin assistant</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
          <span className="text-xs text-muted-foreground">Online</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="divide-y divide-border/50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-center p-6">
              <div className="h-16 w-16 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <Moon className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-display font-semibold text-lg text-foreground mb-2">
                Hey, I'm Lunar!
              </h4>
              <p className="text-muted-foreground text-sm max-w-md">
                Ask me anything about creating Minecraft plugins. I can help with Bukkit, Spigot, Paper, or any other API.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <ChatMessage key={index} role={message.role} content={message.content} />
            ))
          )}
          {isLoading && <ChatMessage role="assistant" content="" isLoading />}
        </div>
      </div>

      <ChatInput onSend={(msg) => onSend(msg)} disabled={isLoading} />
    </div>
  );
}
