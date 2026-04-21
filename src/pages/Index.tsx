import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, Send, ArrowRight, Sparkles, Layers, Coins, Shield, LogIn, LogOut, User, FolderOpen, Globe, Loader2, Plus, Upload, Settings } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useProjects, Project } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/ProjectCard";
import { toast } from "sonner";
import { importPluginFromZip, PluginFile } from "@/lib/pluginExport";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, isAdmin, loading } = useAuthContext();
  const [inputValue, setInputValue] = useState("");
  const { myProjects, communityProjects, isLoading, deleteProject, togglePublic } = useProjects();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/auth");
      return;
    }
    if (inputValue.trim()) {
      navigate("/editor", { state: { initialPrompt: inputValue.trim() } });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleOpenProject = (project: Project) => {
    navigate("/editor", { state: { loadProject: project } });
  };

  const handleDeleteProject = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await deleteProject(projectToDelete);
      toast.success("Project deleted");
    } catch (err) {
      toast.error("Failed to delete project");
    }
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  const handleTogglePublic = async (project: Project) => {
    try {
      await togglePublic(project.id, !project.is_public);
      toast.success(project.is_public ? "Project is now private" : "Project is now public");
    } catch (err) {
      toast.error("Failed to update project");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      toast.error("Please select a .zip file");
      return;
    }

    setIsImporting(true);
    try {
      const project = await importPluginFromZip(file);
      toast.success(`Imported ${project.name} with ${project.files.length} files`);
      
      // Navigate to editor with imported files
      navigate("/editor", { 
        state: { 
          loadProject: {
            id: null, // New project, no ID yet
            name: project.name,
            files: project.files,
            description: `Imported plugin with ${project.files.length} files`,
            is_public: false,
            downloads: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: user?.id || '',
          }
        } 
      });
    } catch (err) {
      console.error('Import error:', err);
      toast.error("Failed to import plugin. Make sure it's a valid .zip file.");
    } finally {
      setIsImporting(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Subtle ambient backdrop */}
      <div className="fixed inset-0 bg-cosmic pointer-events-none" />
      <div className="fixed inset-0 bg-stars pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Moon className="h-4 w-4 text-primary" />
          </div>
          <span className="font-display text-base text-foreground">
            Lunar Sky Studios
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Button>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary rounded-md border border-border">
                <Coins className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium font-mono">{profile?.credits ?? 0}</span>
              </div>

              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 hover:bg-secondary rounded-md p-1 transition-colors"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {profile?.display_name?.substring(0, 2).toUpperCase() || profile?.email?.substring(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground hidden md:block">
                  {profile?.display_name || profile?.email}
                </span>
              </button>

              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} className="hidden md:flex h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/auth')}
              className="gap-2"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-4 relative z-10">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto animate-fade-in-up py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary rounded-full border border-border mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground font-mono">AI-powered plugin generation</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-display text-foreground mb-4 leading-[1.05] tracking-tight">
            Build Minecraft plugins
            <br />
            <span className="text-gradient">in plain English.</span>
          </h1>

          <p className="text-base text-muted-foreground mb-10 max-w-lg mx-auto">
            Describe your idea. Lunar writes production-ready Bukkit, Spigot, and Paper plugins for you.
          </p>

          {/* Input Card */}
          <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-4 shadow-2xl card-hover focus-within:border-primary/50 transition-colors">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={user ? "e.g. A plugin that adds a /heal command with cooldown..." : "Sign in to start creating plugins..."}
                rows={3}
                disabled={!user}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none resize-none text-sm disabled:opacity-50"
              />

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary rounded-md text-xs text-muted-foreground font-mono">
                    <Layers className="h-3 w-3 text-primary" />
                    Spigot / Paper
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!user || !inputValue.trim()}
                  size="sm"
                  className="gap-2"
                >
                  {user ? (
                    <>
                      Create
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      Sign in
                      <LogIn className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8 text-sm">
            <button
              onClick={() => navigate("/editor")}
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-muted border border-border rounded-md text-xs text-muted-foreground hover:text-foreground transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              New project
            </button>

            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-muted border border-border rounded-md text-xs text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
            >
              {isImporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              Import .zip
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileImport}
              className="hidden"
            />

            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md text-xs text-primary font-mono">
                <Coins className="h-3.5 w-3.5" />
                <span>{profile?.credits ?? 0} credits</span>
              </div>
            )}
          </div>
        </div>

        {/* Your Recent Projects Section */}
        {user && myProjects.length > 0 && (
          <section className="max-w-7xl mx-auto w-full py-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-display text-foreground uppercase tracking-wider">Your projects</h2>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {myProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isOwner={true}
                    onOpen={handleOpenProject}
                    onDelete={handleDeleteProject}
                    onTogglePublic={handleTogglePublic}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Community Projects Section */}
        {communityProjects.length > 0 && (
          <section className="max-w-7xl mx-auto w-full py-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Globe className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-display text-foreground uppercase tracking-wider">Community</h2>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {communityProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isOwner={project.user_id === user?.id}
                    onOpen={handleOpenProject}
                    onDelete={project.user_id === user?.id ? handleDeleteProject : undefined}
                    onTogglePublic={project.user_id === user?.id ? handleTogglePublic : undefined}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="https://discord.gg/PngVGx4Fpy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Discord</a>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © 2025 Lunar Sky Studios
          </p>
        </div>
      </footer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The project and all its files will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;