import { Project } from "@/hooks/useProjectHistory";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, FolderOpen, Clock, FileCode, X, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ProjectHistoryPanelProps {
  projects: Project[];
  onLoad: (project: Project) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function ProjectHistoryPanel({ projects, onLoad, onDelete, onClose }: ProjectHistoryPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
            <Clock className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm text-foreground tracking-wide">History</h3>
            <p className="text-xs text-muted-foreground font-mono">{projects.length} projects</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6 relative">
            <div className="absolute inset-0 bg-grid-dense opacity-10" />
            <div className="relative z-10">
              <div className="h-14 w-14 rounded-xl bg-muted/50 border border-border flex items-center justify-center mb-4 mx-auto">
                <FolderOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm font-display">No saved projects</p>
              <p className="text-xs text-muted-foreground/70 mt-1 font-body">
                Save your work to access it later
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className={cn(
                  "group relative p-4 rounded-xl border border-border bg-card/50 hover:bg-secondary/50 transition-all duration-300 cursor-pointer",
                  "hover:border-accent/30 hover:shadow-[0_0_20px_hsl(320_100%_60%/0.1)]"
                )}
                onClick={() => onLoad(project)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Accent line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-gradient-to-b from-primary to-accent rounded-full group-hover:h-1/2 transition-all duration-300" />
                
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary/50 rounded-full">
                        <FileCode className="h-3 w-3" />
                        {project.files.length} files
                      </span>
                      <span className="font-mono">
                        {formatDistanceToNow(project.updatedAt, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(project.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
