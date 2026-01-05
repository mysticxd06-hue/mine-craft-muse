import { Project } from "@/hooks/useProjectHistory";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, FolderOpen, Clock, FileCode } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProjectHistoryPanelProps {
  projects: Project[];
  onLoad: (project: Project) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function ProjectHistoryPanel({ projects, onLoad, onDelete, onClose }: ProjectHistoryPanelProps) {
  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="font-display font-semibold text-sm text-foreground">Project History</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <FolderOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">No saved projects yet</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => onLoad(project)}
                    className="flex-1 text-left"
                  >
                    <h4 className="font-medium text-sm text-foreground truncate">
                      {project.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileCode className="h-3 w-3" />
                        {project.files.length} files
                      </span>
                      <span>
                        {formatDistanceToNow(project.updatedAt, { addSuffix: true })}
                      </span>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
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
