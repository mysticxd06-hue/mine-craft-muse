import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles } from "lucide-react";

export type AIModel = 
  | "google/gemini-2.5-pro"
  | "google/gemini-2.5-flash"
  | "google/gemini-2.5-flash-lite"
  | "openai/gpt-5"
  | "openai/gpt-5-mini"
  | "openai/gpt-5-nano";

interface ModelInfo {
  name: string;
  description: string;
  speed: "Fast" | "Medium" | "Slow";
  quality: "Best" | "Great" | "Good";
}

export const AI_MODELS: Record<AIModel, ModelInfo> = {
  "google/gemini-2.5-pro": {
    name: "Gemini 2.5 Pro",
    description: "Best quality, complex reasoning",
    speed: "Slow",
    quality: "Best",
  },
  "google/gemini-2.5-flash": {
    name: "Gemini 2.5 Flash",
    description: "Balanced speed & quality",
    speed: "Fast",
    quality: "Great",
  },
  "google/gemini-2.5-flash-lite": {
    name: "Gemini 2.5 Flash Lite",
    description: "Fastest, simple tasks",
    speed: "Fast",
    quality: "Good",
  },
  "openai/gpt-5": {
    name: "GPT-5",
    description: "Powerful all-rounder",
    speed: "Slow",
    quality: "Best",
  },
  "openai/gpt-5-mini": {
    name: "GPT-5 Mini",
    description: "Good balance for most tasks",
    speed: "Medium",
    quality: "Great",
  },
  "openai/gpt-5-nano": {
    name: "GPT-5 Nano",
    description: "Fast & efficient",
    speed: "Fast",
    quality: "Good",
  },
};

interface ModelSelectorProps {
  value: AIModel;
  onChange: (model: AIModel) => void;
  disabled?: boolean;
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AIModel)} disabled={disabled}>
      <SelectTrigger className="w-[180px] h-8 text-xs bg-background/50 border-border/50">
        <Sparkles className="h-3 w-3 mr-1.5 text-primary" />
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Google Models</div>
        {(["google/gemini-2.5-pro", "google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"] as AIModel[]).map((modelId) => {
          const model = AI_MODELS[modelId];
          return (
            <SelectItem key={modelId} value={modelId} className="py-2">
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-muted-foreground">{model.description}</span>
              </div>
            </SelectItem>
          );
        })}
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">OpenAI Models</div>
        {(["openai/gpt-5", "openai/gpt-5-mini", "openai/gpt-5-nano"] as AIModel[]).map((modelId) => {
          const model = AI_MODELS[modelId];
          return (
            <SelectItem key={modelId} value={modelId} className="py-2">
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-muted-foreground">{model.description}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
