import { PluginFile } from "@/lib/pluginExport";
import { File, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-card">
        <File className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Select a file to view its contents</p>
      </div>
    );
  }

  const lines = file.content.split("\n");
  const language = getLanguage(file.path);

  return (
    <div className="flex flex-col h-full bg-card">
      {/* File tabs header */}
      <div className="flex items-center border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2 px-4 py-2 bg-card border-r border-border">
          <File className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-mono text-foreground">
            {file.path.split("/").pop()}
          </span>
        </div>
        <div className="ml-auto pr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2"
          >
            {copied ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto">
        <div className="flex min-h-full">
          {/* Line numbers */}
          <div className="flex-shrink-0 bg-secondary/30 border-r border-border px-3 py-4 select-none">
            {lines.map((_, i) => (
              <div
                key={i}
                className="text-xs font-mono text-muted-foreground text-right leading-6"
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code */}
          <pre className="flex-1 p-4 overflow-x-auto">
            <code className={`language-${language} text-sm font-mono leading-6`}>
              {lines.map((line, i) => (
                <div key={i} className="whitespace-pre text-foreground/90">
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

  // Find comments first (highest priority)
  let match;
  while ((match = comments.exec(line)) !== null) {
    spans.push({
      start: match.index,
      end: match.index + match[0].length,
      className: "text-muted-foreground italic",
      text: match[0],
    });
  }

  // Find strings
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

  // Find annotations
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

  // Find keywords
  while ((match = keywords.exec(line)) !== null) {
    const overlaps = spans.some(s => match!.index >= s.start && match!.index < s.end);
    if (!overlaps) {
      spans.push({
        start: match.index,
        end: match.index + match[0].length,
        className: "text-purple-400 font-medium",
        text: match[0],
      });
    }
  }

  if (spans.length === 0) return line;

  // Sort by position
  spans.sort((a, b) => a.start - b.start);

  // Build result
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
        <span className="text-cyan-400">{key}</span>
        <span className="text-foreground">{colon}</span>
        <span className="text-green-400">{rest}</span>
      </>
    );
  }

  return line;
}

function highlightXml(line: string): React.ReactNode {
  // Simple XML highlighting
  const tagPattern = /<\/?[\w-]+/g;
  const attrPattern = /\s[\w-]+=/g;
  const valuePattern = /"[^"]*"/g;

  let result = line;
  
  // Highlight tags
  result = line.replace(tagPattern, (match) => `<span class="text-cyan-400">${match}</span>`);
  
  return <span dangerouslySetInnerHTML={{ __html: result }} />;
}
