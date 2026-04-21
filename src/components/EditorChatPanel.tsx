import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Moon } from "lucide-react";
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
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-card/40">
        <div className="h-7 w-7 bg-primary/15 border border-primary/30 rounded-md flex items-center justify-center">
          <Moon className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-sm text-foreground leading-tight">Lunar</h3>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Plugin assistant</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
          <span className="text-[10px] text-muted-foreground font-mono uppercase">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="divide-y divide-border/40">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-center p-6">
              <div className="h-12 w-12 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center mb-4">
                <Moon className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-display text-base text-foreground mb-1">
                Hey, I'm <span className="text-gradient">Lunar</span>
              </h4>
              <p className="text-muted-foreground text-xs max-w-[260px]">
                Tell me what Minecraft plugin you'd like to create.
              </p>

              <div className="flex flex-wrap gap-1.5 justify-center mt-5">
                {["Commands", "Events", "Configs", "GUIs"].map((tag) => (
                  <span key={tag} className="px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-secondary rounded border border-border">
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
        <ChatInput 
          onSend={(msg, img) => onSend(msg, img)} 
          disabled={isLoading} 
          compact 
        />
      </div>
    </div>
  );
}
