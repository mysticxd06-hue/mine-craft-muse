import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload, Package } from 'lucide-react';
import { 
  parsePluginFiles, 
  hasPluginFiles, 
  exportPluginAsZip, 
  downloadZip, 
  importPluginFromZip,
  formatPluginFilesForChat,
  getPluginName,
  type PluginFile 
} from '@/lib/pluginExport';
import { toast } from '@/hooks/use-toast';

interface PluginActionsProps {
  lastAssistantMessage?: string;
  onImport: (formattedContent: string) => void;
}

export function PluginActions({ lastAssistantMessage, onImport }: PluginActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const canExport = lastAssistantMessage && hasPluginFiles(lastAssistantMessage);
  
  const handleExport = async () => {
    if (!lastAssistantMessage) return;
    
    const files = parsePluginFiles(lastAssistantMessage);
    if (files.length === 0) {
      toast({
        title: "No plugin files found",
        description: "Ask the AI to generate a complete plugin first.",
        variant: "destructive",
      });
      return;
    }
    
    const pluginName = getPluginName(files);
    const project = {
      name: pluginName,
      files,
      createdAt: Date.now(),
    };
    
    try {
      const blob = await exportPluginAsZip(project);
      const filename = `${pluginName}-${Date.now()}.zip`;
      downloadZip(blob, filename);
      
      toast({
        title: "Plugin exported!",
        description: `Downloaded ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.zip')) {
      toast({
        title: "Invalid file",
        description: "Please select a ZIP file",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const project = await importPluginFromZip(file);
      const formatted = formatPluginFilesForChat(project);
      onImport(formatted);
      
      toast({
        title: "Plugin imported!",
        description: `Loaded ${project.name} with ${project.files.length} files`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
    
    // Reset input
    e.target.value = '';
  };
  
  const handleCompileRequest = () => {
    toast({
      title: "Compile tip",
      description: "Ask the AI to 'create a complete plugin' or 'generate all files for my plugin' to get exportable code!",
    });
  };
  
  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleImportClick}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Import
      </Button>
      
      <Button
        variant={canExport ? "default" : "outline"}
        size="sm"
        onClick={canExport ? handleExport : handleCompileRequest}
        className="gap-2"
      >
        {canExport ? (
          <>
            <Download className="h-4 w-4" />
            Export Plugin
          </>
        ) : (
          <>
            <Package className="h-4 w-4" />
            Compile
          </>
        )}
      </Button>
    </div>
  );
}
