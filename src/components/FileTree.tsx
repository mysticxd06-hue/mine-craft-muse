import { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Sparkles } from "lucide-react";
import { PluginFile } from "@/lib/pluginExport";
import { cn } from "@/lib/utils";

interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
}

interface TreeBuildNode {
  name: string;
  path: string;
  type: "file" | "folder";
  childrenMap?: Record<string, TreeBuildNode>;
}

interface FileTreeProps {
  files: PluginFile[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
}

function buildTree(files: PluginFile[]): FileTreeNode[] {
  const root: Record<string, TreeBuildNode> = {};

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");

      if (!current[part]) {
        current[part] = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          childrenMap: isFile ? undefined : {},
        };
      }

      if (!isFile && current[part].childrenMap) {
        current = current[part].childrenMap!;
      }
    }
  }

  function toArray(obj: Record<string, TreeBuildNode>): FileTreeNode[] {
    return Object.values(obj)
      .map((node): FileTreeNode => ({
        name: node.name,
        path: node.path,
        type: node.type,
        children: node.childrenMap ? toArray(node.childrenMap) : undefined,
      }))
      .sort((a, b) => {
        if (a.type === "folder" && b.type === "file") return -1;
        if (a.type === "file" && b.type === "folder") return 1;
        return a.name.localeCompare(b.name);
      });
  }

  return toArray(root);
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  
  const iconColors: Record<string, string> = {
    java: "text-neon-orange",
    yml: "text-neon-yellow",
    yaml: "text-neon-yellow",
    xml: "text-neon-cyan",
    json: "text-neon-green",
    gradle: "text-neon-cyan",
    properties: "text-muted-foreground",
  };

  return iconColors[ext || ""] || "text-muted-foreground";
}

function TreeNode({
  node,
  depth,
  selectedFile,
  onSelectFile,
  expandedFolders,
  toggleFolder,
}: {
  node: FileTreeNode;
  depth: number;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  expandedFolders: Set<string>;
  toggleFolder: (path: string) => void;
}) {
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedFile === node.path;

  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => toggleFolder(node.path)}
          className={cn(
            "flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-secondary/50 transition-all text-left group",
            "text-foreground/80 hover:text-foreground"
          )}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          <span className="transition-transform duration-200">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </span>
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-neon-yellow shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-neon-yellow/70 shrink-0" />
          )}
          <span className="truncate font-mono text-xs">{node.name}</span>
        </button>
        {isExpanded && node.children && (
          <div className="relative">
            <div 
              className="absolute left-0 top-0 bottom-0 w-px bg-border/50" 
              style={{ marginLeft: `${depth * 12 + 20}px` }} 
            />
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedFile={selectedFile}
                onSelectFile={onSelectFile}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelectFile(node.path)}
      className={cn(
        "flex items-center gap-2 w-full px-3 py-1.5 text-sm transition-all text-left group",
        isSelected
          ? "bg-primary/15 text-primary border-l-2 border-primary"
          : "hover:bg-secondary/50 text-foreground/70 hover:text-foreground border-l-2 border-transparent"
      )}
      style={{ paddingLeft: `${depth * 12 + 24}px` }}
    >
      <File className={cn("h-4 w-4 shrink-0 transition-colors", getFileIcon(node.name))} />
      <span className="truncate font-mono text-xs">{node.name}</span>
    </button>
  );
}

export function FileTree({ files, selectedFile, onSelectFile }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    const folders = new Set<string>();
    for (const file of files) {
      const parts = file.path.split("/");
      for (let i = 1; i < parts.length; i++) {
        folders.add(parts.slice(0, i).join("/"));
      }
    }
    return folders;
  });

  const tree = buildTree(files);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 relative">
        <div className="absolute inset-0 bg-grid-dense opacity-10" />
        <div className="relative z-10">
          <div className="h-12 w-12 rounded-xl bg-muted/50 border border-border flex items-center justify-center mb-3 mx-auto">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground font-display">No files yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1 font-body">
            Start chatting to generate code
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      {tree.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          depth={0}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
          expandedFolders={expandedFolders}
          toggleFolder={toggleFolder}
        />
      ))}
    </div>
  );
}
