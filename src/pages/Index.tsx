import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, Send, ArrowRight, Sparkles, Layers, Coins, Shield, LogIn, LogOut, User, FolderOpen, Globe, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useProjects, Project } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/ProjectCard";
import { toast } from "sonner";
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

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Cosmic background */}
      <div className="fixed inset-0 bg-cosmic pointer-events-none" />
      <div className="fixed inset-0 bg-stars pointer-events-none opacity-50" />
      
      {/* Floating orbs */}
      <div className="fixed top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="fixed bottom-20 right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      <div className="fixed top-1/2 left-1/2 w-96 h-96 bg-lunar-pink/5 rounded-full blur-3xl animate-pulse-slow" />
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Moon className="h-7 w-7 text-primary" />
            <div className="absolute inset-0 blur-md bg-primary/50 animate-pulse-slow" />
          </div>
          <span className="font-display text-xl tracking-wide text-foreground">
            Lunar Sky Studios
          </span>
        </div>
        
        <div className="flex items-center gap-4">
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg border border-border">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">{profile?.credits ?? 0}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm text-muted-foreground hidden md:block">
                  {profile?.display_name || profile?.email}
                </span>
              </div>
              
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
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
        <div className="text-center max-w-3xl mx-auto animate-fade-in-up py-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full border border-border mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">AI-Powered Plugin Generation</span>
          </div>
          
          {/* Greeting */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display text-foreground mb-4 leading-tight">
            Hey, I'm{" "}
            <span className="text-gradient">Lunar</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-xl mx-auto">
            Your AI companion for creating Minecraft plugins. 
            <span className="text-foreground"> Just describe what you want.</span>
          </p>

          {/* Input Card */}
          <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5 shadow-2xl card-hover">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={user ? "Describe the plugin you want to create..." : "Sign in to start creating plugins..."}
                rows={3}
                disabled={!user}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none resize-none text-lg disabled:opacity-50"
              />
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg text-sm text-muted-foreground">
                    <Layers className="h-4 w-4 text-primary" />
                    Spigot Plugin
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={!user || !inputValue.trim()}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all gap-2 rounded-xl px-6"
                >
                  {user ? (
                    <>
                      Create
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Sign In to Start
                      <LogIn className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-10 text-sm">
            <button 
              onClick={() => navigate("/editor")}
              className="flex items-center gap-2 px-4 py-2 bg-secondary/30 hover:bg-secondary/50 border border-border rounded-lg text-muted-foreground hover:text-foreground transition-all"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
            
            {user && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg text-primary">
                <Coins className="h-4 w-4" />
                <span>{profile?.credits ?? 0} credits available</span>
              </div>
            )}
          </div>
        </div>

        {/* Your Recent Projects Section */}
        {user && myProjects.length > 0 && (
          <section className="max-w-7xl mx-auto w-full py-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-display text-foreground">Your Recent Projects</h2>
                  <p className="text-sm text-muted-foreground">Continue where you left off</p>
                </div>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          <section className="max-w-7xl mx-auto w-full py-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-display text-foreground">Community Projects</h2>
                  <p className="text-sm text-muted-foreground">Explore plugins shared by others</p>
                </div>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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