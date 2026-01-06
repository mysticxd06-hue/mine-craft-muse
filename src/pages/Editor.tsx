import { useState, useEffect, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useChat, Message, getMessageText } from "@/hooks/useChat";
import { useProjectHistory, Project } from "@/hooks/useProjectHistory";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useProjects, Project as SavedProject } from "@/hooks/useProjects";
import { EditorChatPanel } from "@/components/EditorChatPanel";
import { FileTree } from "@/components/FileTree";
import { CodeViewer } from "@/components/CodeViewer";
import { GitHubCompileButton } from "@/components/GitHubCompileButton";
import { ProjectHistoryPanel } from "@/components/ProjectHistoryPanel";
import { parsePluginFiles, hasPluginFiles, PluginFile, exportPluginAsZip, downloadZip, getPluginName } from "@/lib/pluginExport";
import { Button } from "@/components/ui/button";
import { Moon, Download, ArrowLeft, FolderTree, FileCode, Save, History, Coins, LogIn, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface LocationState {
  initialPrompt?: string;
  messages?: Message[];
  loadProject?: SavedProject;
}

export default function Editor() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const { user, profile, loading, refreshProfile } = useAuthContext();
  
  const { messages, isLoading, sendMessage, addMessage, setAllMessages } = useChat();
  const { projects, saveProject, deleteProject } = useProjectHistory();
  const { saveProject: saveToCloud } = useProjects();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [pluginFiles, setPluginFiles] = useState<PluginFile[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [credits, setCredits] = useState<number>(profile?.credits ?? 0);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Keep credits in sync with profile
  useEffect(() => {
    setCredits(profile?.credits ?? 0);
  }, [profile?.credits]);

  // Fetch fresh credits from database
  const refreshCredits = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single();
    if (data) {
      setCredits(data.credits);
    }
  }, [user]);

  useEffect(() => {
    // Check if we should load a project from navigation state
    if (state?.loadProject) {
      setPluginFiles(state.loadProject.files);
      setCurrentProjectId(state.loadProject.id);
      if (state.loadProject.files.length > 0) {
        const pluginYml = state.loadProject.files.find(f => f.path.endsWith("plugin.yml"));
        const mainClass = state.loadProject.files.find(f => f.path.endsWith(".java") && f.content.includes("extends JavaPlugin"));
        setSelectedFile(pluginYml?.path || mainClass?.path || state.loadProject.files[0].path);
      }
      toast({
        title: "Project loaded!",
        description: `${state.loadProject.name} ready to edit.`,
      });
      // Clear navigation state
      window.history.replaceState({}, document.title);
    } else if (state?.messages) {
      for (const msg of state.messages) {
        addMessage(msg);
      }
    } else if (state?.initialPrompt && user) {
      handleSendWithCredits(state.initialPrompt);
    }
  }, []);

  const handleSendWithCredits = async (content: string, imageBase64?: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to use the AI assistant.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (credits <= 0) {
      toast({
        title: "Insufficient credits",
        description: "You don't have enough credits. Contact an admin for more.",
        variant: "destructive",
      });
      return;
    }

    // Send message (credits are deducted server-side)
    const result = await sendMessage(content, imageBase64);
    
    if (!result.success) {
      if (result.creditError) {
        toast({
          title: "Insufficient credits",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
      return;
    }

    // Refresh credits after successful message
    await refreshCredits();
  };

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
        description: "Ask Lunar to generate a plugin first.",
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

  const handleSaveProject = async () => {
    if (pluginFiles.length === 0) {
      toast({
        title: "Nothing to save",
        description: "Generate some plugin code first.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save projects to the cloud.",
        variant: "destructive",
      });
      return;
    }

    const pluginName = getPluginName(pluginFiles);
    setIsSaving(true);
    
    try {
      // Save to cloud
      const saved = await saveToCloud(
        pluginName,
        pluginFiles,
        `A Minecraft plugin with ${pluginFiles.length} files`,
        false,
        currentProjectId || undefined
      );
      setCurrentProjectId(saved.id);
      
      // Also save to local history
      saveProject(pluginName, messages, pluginFiles);
      
      toast({
        title: "Project saved!",
        description: `${pluginName} saved to your projects.`,
      });
    } catch (err) {
      console.error('Save error:', err);
      toast({
        title: "Failed to save",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-4 shrink-0">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        
        <div className="h-5 w-px bg-border" />
        
        <div className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-primary" />
          <span className="font-display text-foreground">
            {pluginFiles.length > 0 ? getPluginName(pluginFiles) : "New Plugin"}
          </span>
        </div>

        {/* User Info & Credits */}
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg border border-border">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">{credits}</span>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg border border-border">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">{profile?.display_name || profile?.email?.split('@')[0]}</span>
              </div>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')} className="gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          )}
          
          <div className="h-5 w-px bg-border mx-1" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className={showHistory ? "bg-secondary" : ""}
          >
            <History className="h-4 w-4 mr-1.5" />
            History
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveProject}
            disabled={pluginFiles.length === 0 || isSaving}
          >
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          
          <div className="h-5 w-px bg-border mx-1" />
          
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
            onFilesUpdate={(files) => setPluginFiles(files)}
          />
        </div>
      </header>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Chat or History */}
        <div className="w-96 border-r border-border flex flex-col shrink-0 bg-card/30">
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
              onSend={handleSendWithCredits}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Middle Panel - File Tree */}
        <div className="w-64 border-r border-border bg-card/20 flex flex-col shrink-0">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <FolderTree className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Files</span>
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
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center mb-6 animate-float">
                <FileCode className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-display text-xl text-foreground mb-2">
                {pluginFiles.length === 0 ? "Ready to Create" : "Select a File"}
              </h3>
              <p className="text-muted-foreground text-sm max-w-md">
                {pluginFiles.length === 0 
                  ? user 
                    ? "Start chatting with Lunar to generate your Minecraft plugin."
                    : "Sign in to start creating plugins with Lunar."
                  : "Click on a file in the tree to view its contents."}
              </p>
              
              {!user && (
                <Button 
                  onClick={() => navigate('/auth')} 
                  className="mt-6 bg-gradient-to-r from-primary to-accent"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
