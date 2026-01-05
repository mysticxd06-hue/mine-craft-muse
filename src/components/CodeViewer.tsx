import { PluginFile } from "@/lib/pluginExport";
import { File, Copy, Check, Code } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeViewerProps {
  file: PluginFile | null;
}

function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    java: "java",
    yml: "yaml",
    yaml: "yaml",
    xml: "xml",
    json: "json",
    gradle: "groovy",
    properties: "properties",
    md: "markdown",
    txt: "text",
  };
  return langMap[ext || ""] || "text";
}

function getLanguageColor(lang: string): string {
  const colors: Record<string, string> = {
    java: "text-orange-400",
    yaml: "text-yellow-400",
    xml: "text-blue-400",
    json: "text-green-400",
    groovy: "text-cyan-400",
    properties: "text-muted-foreground",
  };
  return colors[lang] || "text-muted-foreground";
}

// HTML escape function to prevent XSS
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export function CodeViewer({ file }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!file) return;
    await navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background">
        <div className="h-14 w-14 rounded-xl bg-secondary border border-border flex items-center justify-center mb-4">
          <Code className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Select a file to view</p>
      </div>
    );
  }

  const lines = file.content.split("\n");
  const language = getLanguage(file.path);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* File tab header */}
      <div className="flex items-center border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary/10 to-transparent border-r border-border">
          <File className={cn("h-4 w-4", getLanguageColor(language))} />
          <span className="text-sm font-mono text-foreground">
            {file.path.split("/").pop()}
          </span>
        </div>
        <div className="flex-1" />
        <div className="px-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-3 gap-2 hover:bg-primary/10"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-400" />
                <span className="text-xs text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span className="text-xs">Copy</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto">
        <div className="flex min-h-full">
          {/* Line numbers */}
          <div className="flex-shrink-0 bg-card/50 border-r border-border px-3 py-4 select-none">
            {lines.map((_, i) => (
              <div
                key={i}
                className="text-xs font-mono text-muted-foreground/40 text-right leading-6 tabular-nums"
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code */}
          <pre className="flex-1 p-4 overflow-x-auto">
            <code className={`language-${language} text-sm font-mono leading-6`}>
              {lines.map((line, i) => (
                <div key={i} className="whitespace-pre text-foreground/85 hover:bg-primary/5 transition-colors">
                  {highlightLine(line, language)}
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

// Simple syntax highlighting
function highlightLine(line: string, language: string): React.ReactNode {
  if (language === "java") {
    return highlightJava(line);
  }
  if (language === "yaml") {
    return highlightYaml(line);
  }
  if (language === "xml") {
    return highlightXml(line);
  }
  return line;
}

function highlightJava(line: string): React.ReactNode {
  const keywords = /\b(public|private|protected|class|interface|extends|implements|import|package|static|final|void|return|new|if|else|for|while|try|catch|throw|throws|this|super|null|true|false|int|boolean|String|double|float|long|byte|short|char)\b/g;
  const strings = /"[^"]*"/g;
  const comments = /\/\/.*/g;
  const annotations = /@\w+/g;

  let result = line;
  const spans: { start: number; end: number; className: string; text: string }[] = [];

  let match;
  while ((match = comments.exec(line)) !== null) {
    spans.push({
      start: match.index,
      end: match.index + match[0].length,
      className: "text-muted-foreground italic",
      text: match[0],
    });
  }

  while ((match = strings.exec(line)) !== null) {
    const overlaps = spans.some(s => match!.index >= s.start && match!.index < s.end);
    if (!overlaps) {
      spans.push({
        start: match.index,
        end: match.index + match[0].length,
        className: "text-green-400",
        text: match[0],
      });
    }
  }

  while ((match = annotations.exec(line)) !== null) {
    const overlaps = spans.some(s => match!.index >= s.start && match!.index < s.end);
    if (!overlaps) {
      spans.push({
        start: match.index,
        end: match.index + match[0].length,
        className: "text-yellow-400",
        text: match[0],
      });
    }
  }

  while ((match = keywords.exec(line)) !== null) {
    const overlaps = spans.some(s => match!.index >= s.start && match!.index < s.end);
    if (!overlaps) {
      spans.push({
        start: match.index,
        end: match.index + match[0].length,
        className: "text-primary font-medium",
        text: match[0],
      });
    }
  }

  if (spans.length === 0) return line;

  spans.sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let lastEnd = 0;

  spans.forEach((span, i) => {
    if (span.start > lastEnd) {
      parts.push(line.slice(lastEnd, span.start));
    }
    parts.push(
      <span key={i} className={span.className}>
        {span.text}
      </span>
    );
    lastEnd = span.end;
  });

  if (lastEnd < line.length) {
    parts.push(line.slice(lastEnd));
  }

  return <>{parts}</>;
}

function highlightYaml(line: string): React.ReactNode {
  const keyMatch = line.match(/^(\s*)([a-zA-Z_-]+)(:)/);
  const comment = line.match(/#.*/);

  if (comment) {
    const idx = line.indexOf("#");
    return (
      <>
        {line.slice(0, idx)}
        <span className="text-muted-foreground italic">{comment[0]}</span>
      </>
    );
  }

  if (keyMatch) {
    const [, indent, key, colon] = keyMatch;
    const rest = line.slice(keyMatch[0].length);
    return (
      <>
        {indent}
        <span className="text-primary">{key}</span>
        <span className="text-foreground">{colon}</span>
        <span className="text-green-400">{rest}</span>
      </>
    );
  }

  return line;
}

// Fixed: Use React elements instead of dangerouslySetInnerHTML to prevent XSS
function highlightXml(line: string): React.ReactNode {
  const tagPattern = /<\/?[\w-]+/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = tagPattern.exec(line)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }
    // Add the highlighted tag
    parts.push(
      <span key={match.index} className="text-primary">
        {match[0]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last match
  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : line;
}
