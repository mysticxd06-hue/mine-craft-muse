import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";

export type AIModel = "claude" | "deepseek";

const STORAGE_KEY = "lunar_selected_model";

export function getSelectedModel(): AIModel {
  if (typeof window === "undefined") return "claude";
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "deepseek" ? "deepseek" : "claude";
}

export function setSelectedModel(model: AIModel) {
  localStorage.setItem(STORAGE_KEY, model);
}

interface ModelSelectorProps {
  value: AIModel;
  onChange: (model: AIModel) => void;
  compact?: boolean;
}

export function ModelSelector({ value, onChange, compact }: ModelSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AIModel)}>
      <SelectTrigger className={compact ? "h-8 text-xs w-[140px]" : "w-[180px]"}>
        <Sparkles className="h-3 w-3 mr-1.5 opacity-60" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="claude">Claude Sonnet 4.5</SelectItem>
        <SelectItem value="deepseek">DeepSeek V4 Pro</SelectItem>
      </SelectContent>
    </Select>
  );
}
