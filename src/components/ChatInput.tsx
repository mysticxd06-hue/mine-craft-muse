import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Send, ImagePlus, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string, imageBase64?: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function ChatInput({ onSend, disabled, compact }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || imageBase64) && !disabled) {
      onSend(input.trim(), imageBase64 || undefined);
      setInput("");
      setImagePreview(null);
      setImageBase64(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn(
        "flex flex-col gap-3 border-t border-border bg-card/30 backdrop-blur-sm transition-all",
        compact ? "p-3" : "p-4",
        isFocused && "border-t-primary/50"
      )}
    >
      {imagePreview && (
        <div className="relative inline-block w-fit">
          <img 
            src={imagePreview} 
            alt="Upload preview" 
            className="h-20 w-20 object-cover rounded-lg border border-border shadow-lg"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 shadow-lg transition-transform hover:scale-110"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      
      <div className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size={compact ? "default" : "lg"}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="shrink-0 border border-border hover:border-primary/50 hover:bg-primary/5"
        >
          <ImagePlus className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </Button>
        <div className={cn(
          "flex-1 relative rounded-lg transition-all",
          isFocused && "ring-2 ring-primary/30"
        )}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={imageBase64 ? "Describe your plugin idea..." : "What plugin do you want to create?"}
            disabled={disabled}
            className={cn(
              "w-full bg-background/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-mono text-sm transition-all",
              compact ? "px-4 py-2.5" : "px-4 py-3"
            )}
          />
          {!input && !imageBase64 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground pointer-events-none">
              <Sparkles className="h-3 w-3" />
              <span className="text-xs font-mono">AI</span>
            </div>
          )}
        </div>
        <Button 
          type="submit" 
          disabled={disabled || (!input.trim() && !imageBase64)} 
          size={compact ? "default" : "lg"}
          variant="hero"
          className="shrink-0"
        >
          <Send className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </Button>
      </div>
    </form>
  );
}
