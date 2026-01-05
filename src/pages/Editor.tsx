import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useChat, Message, getMessageText } from "@/hooks/useChat";
import { useProjectHistory, Project } from "@/hooks/useProjectHistory";
import { EditorChatPanel } from "@/components/EditorChatPanel";
import { FileTree } from "@/components/FileTree";
import { CodeViewer } from "@/components/CodeViewer";
import { GitHubCompileButton } from "@/components/GitHubCompileButton";
import { ProjectHistoryPanel } from "@/components/ProjectHistoryPanel";
import { parsePluginFiles, hasPluginFiles, PluginFile, exportPluginAsZip, downloadZip, getPluginName } from "@/lib/pluginExport";
import { Button } from "@/components/ui/button";
import { Blocks, Download, ArrowLeft, FolderTree, FileCode, Save, History, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface LocationState {
  initialPrompt?: string;
  messages?: Message[];
}

export default function Editor() {
  const location = useLocation();
  const state = location.state as LocationState | null;
  
  const { messages, isLoading, sendMessage, addMessage, setAllMessages } = useChat();
  const { projects, saveProject, deleteProject } = useProjectHistory();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [pluginFiles, setPluginFiles] = useState<PluginFile[]>([]);
  const [showHistory, setShowHistory] = useState(false);

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
      const textContent = getMessageText(msg);
      if (msg.role === "assistant" && hasPluginFiles(textContent)) {
        const files = parsePluginFiles(textContent);
        for (const file of files) {
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

  const handleSaveProject = () => {
    if (messages.length === 0) {
      toast({
        title: "Nothing to save",
        description: "Start a conversation first.",
        variant: "destructive",
      });
      return;
    }

    const pluginName = pluginFiles.length > 0 ? getPluginName(pluginFiles) : "Untitled Plugin";
    saveProject(pluginName, messages, pluginFiles);
    toast({
      title: "Project saved!",
      description: `${pluginName} saved to history.`,
    });
  };

  const handleLoadProject = (project: Project) => {
    setAllMessages(project.messages);
    setPluginFiles(project.files);
    setShowHistory(false);
    toast({
      title: "Project loaded!",
      description: `${project.name} restored.`,
    });
  };

  const handleDeleteProject = (id: string) => {
    deleteProject(id);
    toast({
      title: "Project deleted",
    });
  };

  const selectedPluginFile = pluginFiles.find(f => f.path === selectedFile) || null;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-xl flex items-center px-4 gap-4 shrink-0 relative z-50">
        {/* Left side */}
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        </Link>
        
        <div className="h-6 w-px bg-border" />
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-md" />
            <div className="relative h-8 w-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Blocks className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="font-display font-semibold text-foreground text-sm tracking-wide">
              {pluginFiles.length > 0 ? getPluginName(pluginFiles) : "New Plugin"}
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              {pluginFiles.length} file{pluginFiles.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className={showHistory ? "bg-muted" : ""}
          >
            <History className="h-4 w-4 mr-1.5" />
            History
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveProject}
            disabled={messages.length === 0}
          >
            <Save className="h-4 w-4 mr-1.5" />
            Save
          </Button>
          
          <div className="h-6 w-px bg-border mx-1" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={pluginFiles.length === 0}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <GitHubCompileButton 
            pluginFiles={pluginFiles} 
            disabled={pluginFiles.length === 0} 
          />
        </div>
      </header>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Panel - Chat or History */}
        <div className="w-96 border-r border-border flex flex-col shrink-0 bg-card/30 backdrop-blur-sm">
          {showHistory ? (
            <ProjectHistoryPanel
              projects={projects}
              onLoad={handleLoadProject}
              onDelete={handleDeleteProject}
              onClose={() => setShowHistory(false)}
            />
          ) : (
            <EditorChatPanel
              messages={messages}
              onSend={sendMessage}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Middle Panel - File Tree */}
        <div className="w-64 border-r border-border bg-card/20 flex flex-col shrink-0">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
            <FolderTree className="h-4 w-4 text-primary" />
            <span className="text-sm font-display font-medium text-foreground tracking-wide">Files</span>
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
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {selectedPluginFile ? (
            <CodeViewer file={selectedPluginFile} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 relative">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-grid-dense opacity-20" />
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/5 rounded-full blur-[80px]" />
              
              <div className="relative z-10">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center mb-6 mx-auto">
                  {pluginFiles.length === 0 ? (
                    <Sparkles className="h-10 w-10 text-primary animate-glow-pulse" />
                  ) : (
                    <FileCode className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-display font-semibold text-xl text-foreground mb-3 tracking-wide">
                  {pluginFiles.length === 0 ? "Ready to Create" : "Select a File"}
                </h3>
                <p className="text-muted-foreground text-sm max-w-md font-body leading-relaxed">
                  {pluginFiles.length === 0 
                    ? "Start chatting with the AI to generate your Minecraft plugin code."
                    : "Click on a file in the tree to view its contents."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
