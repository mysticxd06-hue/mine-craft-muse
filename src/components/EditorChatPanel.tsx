import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Sparkles, Zap } from "lucide-react";
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
      <div className="flex items-center gap-3 p-4 border-b border-border bg-secondary/30 shrink-0">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/30 blur-lg" />
          <div className="relative h-10 w-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-sm text-foreground tracking-wide">AI Assistant</h3>
          <p className="text-xs text-muted-foreground font-mono">Plugin Generator</p>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded-full border border-primary/20">
          <Zap className="h-3 w-3 text-primary" />
          <span className="text-xs text-primary font-mono">Ready</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent to-background/50" ref={scrollRef}>
        <div className="divide-y divide-border/30">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-center p-6 relative">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-grid-dense opacity-20" />
              
              <div className="relative z-10">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center mb-4 mx-auto animate-pulse-glow">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-display font-semibold text-lg text-foreground mb-2 tracking-wide">
                  Ready to Create
                </h4>
                <p className="text-muted-foreground text-sm max-w-[240px] font-body leading-relaxed">
                  Describe your Minecraft plugin idea and I'll generate the complete code for you.
                </p>
                
                <div className="flex flex-wrap gap-2 justify-center mt-6">
                  {["Commands", "Events", "Configs"].map((tag) => (
                    <span key={tag} className="px-2 py-1 text-xs font-mono text-primary/80 bg-primary/10 rounded border border-primary/20">
                      {tag}
                    </span>
                  ))}
                </div>
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
