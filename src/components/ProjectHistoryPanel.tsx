import { Project } from "@/hooks/useProjectHistory";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, FolderOpen, Clock, FileCode, X } from "lucide-react";
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
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-display text-sm text-foreground">Project History</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-primary/10">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center mb-3">
              <FolderOpen className="h-7 w-7 text-primary" />
            </div>
            <p className="text-foreground font-medium text-sm">No saved projects</p>
            <p className="text-xs text-muted-foreground mt-1">
              Save your work to access it later
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group p-3 rounded-xl border border-border bg-card/50 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent hover:border-primary/30 transition-all cursor-pointer card-hover"
                onClick={() => onLoad(project)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileCode className="h-3 w-3 text-accent" />
                        {project.files.length} files
                      </span>
                      <span>
                        {formatDistanceToNow(project.updatedAt, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(project.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
