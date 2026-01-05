import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Moon, Sparkles } from "lucide-react";
import { Message, getMessageText } from "@/hooks/useChat";

interface EditorChatPanelProps {
  messages: Message[];
  onSend: (message: string, imageBase64?: string) => void;
  isLoading: boolean;
}

export function EditorChatPanel({ messages, onSend, isLoading }: EditorChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center">
          <Moon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-sm text-foreground">Lunar</h3>
          <p className="text-xs text-muted-foreground">AI Assistant</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-full">
          <span className="h-1.5 w-1.5 bg-primary rounded-full" />
          <span className="text-xs text-primary">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="divide-y divide-border/50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-center p-6">
              <div className="h-14 w-14 rounded-xl bg-secondary border border-border flex items-center justify-center mb-4">
                <Moon className="h-7 w-7 text-primary" />
              </div>
              <h4 className="font-display text-foreground mb-2">
                Hi! I'm Lunar
              </h4>
              <p className="text-muted-foreground text-sm max-w-[240px]">
                Describe your Minecraft plugin idea and I'll create it for you.
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {["Commands", "Events", "Configs"].map((tag) => (
                  <span key={tag} className="px-2 py-1 text-xs font-mono text-muted-foreground bg-secondary rounded border border-border">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <ChatMessage key={index} role={message.role} content={message.content} />
            ))
          )}
          {isLoading && <ChatMessage role="assistant" content="" isLoading />}
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0">
        <ChatInput onSend={onSend} disabled={isLoading} compact />
      </div>
    </div>
  );
}
