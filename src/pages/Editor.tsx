import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useChat, Message } from "@/hooks/useChat";
import { EditorChatPanel } from "@/components/EditorChatPanel";
import { FileTree } from "@/components/FileTree";
import { CodeViewer } from "@/components/CodeViewer";
import { parsePluginFiles, hasPluginFiles, PluginFile, exportPluginAsZip, downloadZip, getPluginName } from "@/lib/pluginExport";
import { Button } from "@/components/ui/button";
import { Blocks, Download, ArrowLeft, Play, Settings, FolderTree, FileCode } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface LocationState {
  initialPrompt?: string;
  messages?: Message[];
}

export default function Editor() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  
  const { messages, isLoading, sendMessage, addMessage } = useChat();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [pluginFiles, setPluginFiles] = useState<PluginFile[]>([]);

  // Initialize with passed state
  useEffect(() => {
    if (state?.messages) {
      for (const msg of state.messages) {
        addMessage(msg);
      }
    } else if (state?.initialPrompt) {
      sendMessage(state.initialPrompt);
    }
  }, []);

  // Extract plugin files from messages
  useEffect(() => {
    const allFiles: PluginFile[] = [];
    for (const msg of messages) {
      if (msg.role === "assistant" && hasPluginFiles(msg.content)) {
        const files = parsePluginFiles(msg.content);
        for (const file of files) {
          // Update or add file
          const existingIdx = allFiles.findIndex(f => f.path === file.path);
          if (existingIdx >= 0) {
            allFiles[existingIdx] = file;
          } else {
            allFiles.push(file);
          }
        }
      }
    }
    setPluginFiles(allFiles);

    // Auto-select first file if none selected
    if (!selectedFile && allFiles.length > 0) {
      const pluginYml = allFiles.find(f => f.path.endsWith("plugin.yml"));
      const mainClass = allFiles.find(f => f.path.endsWith(".java") && f.content.includes("extends JavaPlugin"));
      setSelectedFile(pluginYml?.path || mainClass?.path || allFiles[0].path);
    }
  }, [messages, selectedFile]);

  const handleExport = async () => {
    if (pluginFiles.length === 0) {
      toast({
        title: "No files to export",
        description: "Ask the AI to generate a plugin first.",
        variant: "destructive",
      });
      return;
    }

    const pluginName = getPluginName(pluginFiles);
    const blob = await exportPluginAsZip({ name: pluginName, files: pluginFiles, createdAt: Date.now() });
    downloadZip(blob, `${pluginName}.zip`);
    toast({
      title: "Plugin exported!",
      description: `${pluginName}.zip downloaded successfully.`,
    });
  };

  const selectedPluginFile = pluginFiles.find(f => f.path === selectedFile) || null;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Header */}
      <header className="h-12 border-b border-border bg-card flex items-center px-4 gap-4 shrink-0">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        
        <div className="flex items-center gap-2">
          <Blocks className="h-5 w-5 text-primary" />
          <span className="font-display font-semibold text-foreground">
            {pluginFiles.length > 0 ? getPluginName(pluginFiles) : "New Plugin"}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={pluginFiles.length === 0}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              toast({
                title: "Compile Instructions",
                description: "Use 'mvn clean package' or 'gradle build' to compile your plugin.",
              });
            }}
          >
            <Play className="h-4 w-4 mr-1.5" />
            Compile
          </Button>
        </div>
      </header>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Chat */}
        <div className="w-80 border-r border-border flex flex-col shrink-0">
          <EditorChatPanel
            messages={messages}
            onSend={sendMessage}
            isLoading={isLoading}
          />
        </div>

        {/* Middle Panel - File Tree */}
        <div className="w-64 border-r border-border bg-card/50 flex flex-col shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/50">
            <FolderTree className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Files</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {pluginFiles.length} file{pluginFiles.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex-1 overflow-auto">
            <FileTree
              files={pluginFiles}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
            />
          </div>
        </div>

        {/* Right Panel - Code Viewer */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedPluginFile ? (
            <CodeViewer file={selectedPluginFile} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-card">
              <FileCode className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                No file selected
              </h3>
              <p className="text-muted-foreground text-sm max-w-md">
                {pluginFiles.length === 0 
                  ? "Ask the AI to create a plugin and the files will appear here."
                  : "Select a file from the tree to view its contents."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
