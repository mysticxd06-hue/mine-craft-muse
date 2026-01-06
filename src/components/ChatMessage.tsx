import { useState } from "react";
import { cn } from "@/lib/utils";
import { User, Download, ChevronRight, FileCode, FileText, FolderPlus, RefreshCw } from "lucide-react";
import lunarAvatar from "@/assets/lunar-avatar.png";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { hasPluginFiles, parsePluginFiles, exportPluginAsZip, downloadZip, getPluginName, PluginFile } from "@/lib/pluginExport";
import { toast } from "@/hooks/use-toast";
import { Message, MessageContent, getMessageText } from "@/hooks/useChat";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string | MessageContent[];
  isLoading?: boolean;
}

interface FileGroup {
  created: PluginFile[];
  updated: PluginFile[];
}

function getFileIcon(path: string) {
  if (path.endsWith('.java')) return <FileCode className="h-4 w-4 text-orange-400" />;
  if (path.endsWith('.yml') || path.endsWith('.yaml')) return <FileText className="h-4 w-4 text-yellow-400" />;
  if (path.endsWith('.gradle')) return <FileText className="h-4 w-4 text-green-400" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

function getShortFileName(path: string) {
  const parts = path.split('/');
  const fileName = parts[parts.length - 1];
  if (parts.length > 2) {
    return `.../${parts[parts.length - 2]}/${fileName}`;
  }
  return path;
}

function FileSection({ 
  title, 
  files, 
  icon: Icon,
  defaultOpen = true 
}: { 
  title: string; 
  files: PluginFile[]; 
  icon: React.ElementType;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  if (files.length === 0) return null;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-2">
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full py-1">
        <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
        <Icon className="h-4 w-4" />
        <span>{title}</span>
        <span className="text-xs text-muted-foreground/60">({files.length})</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-6 mt-1 space-y-0.5">
        {files.map((file, idx) => (
          <div 
            key={idx}
            className="flex items-center gap-2 py-1 px-2 rounded hover:bg-secondary/50 transition-colors cursor-default"
          >
            {getFileIcon(file.path)}
            <span className="text-sm text-foreground/80 font-mono truncate">
              {getShortFileName(file.path)}
            </span>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ChatMessage({ role, content, isLoading }: ChatMessageProps) {
  const isAssistant = role === "assistant";
  
  const textContent = typeof content === 'string' ? content : getMessageText({ role, content });
  
  const imageUrl = typeof content !== 'string' 
    ? content.find(c => c.type === 'image_url')?.image_url?.url 
    : null;
  
  const hasFiles = isAssistant && hasPluginFiles(textContent);
  const files = hasFiles ? parsePluginFiles(textContent) : [];
  
  // Extract the message text without file content
  const cleanMessage = textContent
    .replace(/===FILE:.+?===[\s\S]*?===ENDFILE===/g, '')
    .trim();
  
  // For demo purposes, treat all files as "created" 
  // In a real app you'd track which are updates vs new
  const fileGroups: FileGroup = {
    created: files,
    updated: []
  };

  const handleExport = async () => {
    if (files.length === 0) return;
    
    const pluginName = getPluginName(files);
    const project = { name: pluginName, files, createdAt: Date.now() };
    
    try {
      const blob = await exportPluginAsZip(project);
      downloadZip(blob, `${pluginName}-${Date.now()}.zip`);
      toast({ title: "Plugin exported!", description: `Downloaded ${pluginName}.zip` });
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3 p-4 animate-fade-in",
        isAssistant ? "bg-gradient-to-r from-primary/5 to-transparent" : "bg-transparent"
      )}
    >
      {isAssistant ? (
        <img 
          src={lunarAvatar} 
          alt="Lunar" 
          className="h-9 w-9 shrink-0 rounded-xl object-cover border border-primary/20"
        />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary border border-border">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 space-y-2 overflow-hidden min-w-0">
        {imageUrl && (
          <div className="mb-2">
            <img 
              src={imageUrl} 
              alt="Uploaded reference" 
              className="max-h-32 rounded-lg border border-border"
            />
          </div>
        )}
        
        <div className="prose prose-invert max-w-none">
          {isLoading ? (
            <div className="flex items-center gap-2 py-1">
              <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <>
              {/* Clean message text */}
              {cleanMessage && (
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {cleanMessage}
                </div>
              )}
              
              {/* Collapsible file sections */}
              {hasFiles && (
                <div className="mt-3 space-y-1">
                  <FileSection 
                    title="Created" 
                    files={fileGroups.created} 
                    icon={FolderPlus}
                  />
                  <FileSection 
                    title="Updated" 
                    files={fileGroups.updated} 
                    icon={RefreshCw}
                  />
                  
                  <Button 
                    onClick={handleExport} 
                    size="sm" 
                    variant="outline"
                    className="mt-3 gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Plugin
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
