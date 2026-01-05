import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Send, ImagePlus, X } from "lucide-react";
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
        "flex flex-col gap-2 border-t border-border bg-card/80 backdrop-blur-sm",
        compact ? "p-3" : "p-4"
      )}
    >
      {imagePreview && (
        <div className="relative inline-block w-fit">
          <img 
            src={imagePreview} 
            alt="Upload preview" 
            className="h-16 w-16 object-cover rounded-lg border border-border"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
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
          className="shrink-0"
        >
          <ImagePlus className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </Button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={imageBase64 ? "Describe what plugin you want..." : "Ask Lunar anything..."}
          disabled={disabled}
          className={cn(
            "flex-1 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-sm transition-all",
            compact ? "px-3 py-2" : "px-4 py-3"
          )}
        />
        <Button type="submit" disabled={disabled || (!input.trim() && !imageBase64)} size={compact ? "default" : "lg"} className="bg-gradient-to-r from-primary to-accent hover:opacity-90 rounded-xl">
          <Send className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </Button>
      </div>
    </form>
  );
}
