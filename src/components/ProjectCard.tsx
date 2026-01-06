import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Download, 
  Trash2, 
  Globe, 
  Lock, 
  Clock,
  Edit3,
  Eye
} from 'lucide-react';
import { Project } from '@/hooks/useProjects';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  isOwner?: boolean;
  onOpen: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  onTogglePublic?: (project: Project) => void;
}

export function ProjectCard({ 
  project, 
  isOwner, 
  onOpen, 
  onDelete,
  onTogglePublic 
}: ProjectCardProps) {
  const fileCount = project.files?.length || 0;
  const timeAgo = formatDistanceToNow(new Date(project.updated_at), { addSuffix: true });

  return (
    <Card className="group relative overflow-hidden bg-card/60 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground line-clamp-1">{project.name}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{timeAgo}</span>
              </div>
            </div>
          </div>
          
          {isOwner && (
            <Badge variant={project.is_public ? "default" : "secondary"} className="text-xs">
              {project.is_public ? (
                <><Globe className="h-3 w-3 mr-1" /> Public</>
              ) : (
                <><Lock className="h-3 w-3 mr-1" /> Private</>
              )}
            </Badge>
          )}
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {project.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {fileCount} files
          </span>
          {project.is_public && (
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              {project.downloads} downloads
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            className="flex-1 gap-2"
            onClick={() => onOpen(project)}
          >
            {isOwner ? (
              <><Edit3 className="h-3 w-3" /> Edit</>
            ) : (
              <><Eye className="h-3 w-3" /> View</>
            )}
          </Button>
          
          {isOwner && (
            <>
              {onTogglePublic && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onTogglePublic(project)}
                >
                  {project.is_public ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                </Button>
              )}
              
              {onDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(project.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
