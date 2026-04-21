import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PluginFile } from "@/lib/pluginExport";

interface PluginProgressChipsProps {
  files: PluginFile[];
  isStreaming?: boolean;
}

/**
 * Shows 8 status chips summarizing what was generated for the plugin.
 * Each chip lights up when its corresponding requirement is detected.
 */
export function PluginProgressChips({ files, isStreaming }: PluginProgressChipsProps) {
  const has = (predicate: (f: PluginFile) => boolean) => files.some(predicate);

  const checks = [
    {
      label: "Main class",
      done: has((f) => f.path.endsWith(".java") && /extends\s+JavaPlugin/.test(f.content)),
    },
    {
      label: "plugin.yml",
      done: has((f) => f.path.endsWith("plugin.yml")),
    },
    {
      label: "pom.xml",
      done: has((f) => f.path.endsWith("pom.xml")),
    },
    {
      label: "Commands",
      done: has((f) => /implements\s+CommandExecutor|onCommand\s*\(/.test(f.content)),
    },
    {
      label: "Listeners",
      done: has((f) => /implements\s+Listener|@EventHandler/.test(f.content)),
    },
    {
      label: "Permissions",
      done: has(
        (f) =>
          (f.path.endsWith("plugin.yml") && /permissions:/.test(f.content)) ||
          /\.hasPermission\(/.test(f.content),
      ),
    },
    {
      label: "Config",
      done: has(
        (f) =>
          f.path.endsWith("config.yml") ||
          /getConfig\(\)|saveDefaultConfig\(\)/.test(f.content),
      ),
    },
    {
      label: "Build ready",
      done:
        files.length >= 3 &&
        has((f) => f.path.endsWith("pom.xml")) &&
        has((f) => f.path.endsWith("plugin.yml")),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-3">
      {checks.map((c) => (
        <div
          key={c.label}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-xs transition-all",
            c.done
              ? "bg-primary/10 border-primary/30 text-foreground"
              : "bg-secondary/40 border-border text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "flex items-center justify-center h-4 w-4 rounded-sm shrink-0",
              c.done ? "bg-primary text-primary-foreground" : "bg-muted",
            )}
          >
            {c.done ? (
              <Check className="h-3 w-3" strokeWidth={3} />
            ) : isStreaming ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            ) : (
              <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            )}
          </span>
          <span className="truncate font-medium">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
