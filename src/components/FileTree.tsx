import { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Moon } from "lucide-react";
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
    java: "text-orange-400",
    yml: "text-yellow-400",
    yaml: "text-yellow-400",
    xml: "text-blue-400",
    json: "text-green-400",
    gradle: "text-cyan-400",
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
            "flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-secondary transition-colors text-left",
            "text-foreground/80 hover:text-foreground"
          )}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-primary/70 shrink-0" />
          )}
          <span className="truncate font-mono text-xs">{node.name}</span>
        </button>
        {isExpanded && node.children && (
          <div>
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
        "flex items-center gap-2 w-full px-2 py-1.5 text-sm transition-colors text-left",
        isSelected
          ? "bg-primary/10 text-primary"
          : "hover:bg-secondary text-foreground/70 hover:text-foreground"
      )}
      style={{ paddingLeft: `${depth * 12 + 24}px` }}
    >
      <File className={cn("h-4 w-4 shrink-0", getFileIcon(node.name))} />
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
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className="h-10 w-10 rounded-lg bg-secondary border border-border flex items-center justify-center mb-3">
          <Moon className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No files yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Ask Lunar to create a plugin
        </p>
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
