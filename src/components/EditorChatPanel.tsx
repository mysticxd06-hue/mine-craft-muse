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
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card/50">
        <div className="h-10 w-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center border border-primary/20">
          <Moon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-sm text-foreground">Lunar</h3>
          <p className="text-xs text-muted-foreground">AI Plugin Assistant</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
          <span className="text-xs text-muted-foreground">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="divide-y divide-border/50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-center p-6">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center mb-4 animate-float">
                <Moon className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-display text-lg text-foreground mb-2">
                Hey, I'm <span className="text-gradient">Lunar</span>
              </h4>
              <p className="text-muted-foreground text-sm max-w-[260px]">
                Tell me what Minecraft plugin you'd like to create and I'll build it for you.
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {["Commands", "Events", "Configs", "GUIs"].map((tag) => (
                  <span key={tag} className="px-3 py-1.5 text-xs font-medium text-primary/80 bg-primary/10 rounded-lg border border-primary/20">
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
