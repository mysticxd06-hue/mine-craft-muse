import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Pickaxe } from "lucide-react";
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
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-secondary/50 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
          <Pickaxe className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-sm text-foreground truncate">Plugin Craftsman</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
          <span className="text-xs text-muted-foreground">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="divide-y divide-border/50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                <Pickaxe className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-display font-semibold text-foreground mb-1">
                Ready to craft!
              </h4>
              <p className="text-muted-foreground text-xs max-w-[200px]">
                Tell me what plugin you want to create
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

      {/* Input */}
      <div className="shrink-0 border-t border-border">
        <ChatInput onSend={onSend} disabled={isLoading} compact />
      </div>
    </div>
  );
}
