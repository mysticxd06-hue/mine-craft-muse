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
    java: "text-neon-orange",
    yaml: "text-neon-yellow",
    xml: "text-neon-cyan",
    json: "text-neon-green",
    groovy: "text-neon-cyan",
    properties: "text-muted-foreground",
  };
  return colors[lang] || "text-muted-foreground";
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
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background relative">
        <div className="absolute inset-0 bg-grid-dense opacity-10" />
        <div className="relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-4 mx-auto">
            <Code className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-display">Select a file to view</p>
        </div>
      </div>
    );
  }

  const lines = file.content.split("\n");
  const language = getLanguage(file.path);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* File tab header */}
      <div className="flex items-center border-b border-border bg-card/50">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-secondary/30 border-r border-border">
          <File className={cn("h-4 w-4", getLanguageColor(language))} />
          <span className="text-sm font-mono text-foreground">
            {file.path.split("/").pop()}
          </span>
          <span className={cn("text-xs font-display uppercase tracking-wider", getLanguageColor(language))}>
            {language}
          </span>
        </div>
        <div className="flex-1" />
        <div className="px-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-3 gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-neon-green" />
                <span className="text-xs font-mono text-neon-green">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span className="text-xs font-mono">Copy</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto relative">
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" 
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.03) 2px, rgba(0,255,255,0.03) 4px)'
          }} 
        />
        
        <div className="flex min-h-full">
          {/* Line numbers */}
          <div className="flex-shrink-0 bg-secondary/20 border-r border-border px-4 py-4 select-none sticky left-0">
            {lines.map((_, i) => (
              <div
                key={i}
                className="text-xs font-mono text-muted-foreground/50 text-right leading-6 tabular-nums"
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code */}
          <pre className="flex-1 p-4 overflow-x-auto">
            <code className={`language-${language} text-sm font-mono leading-6`}>
              {lines.map((line, i) => (
                <div key={i} className="whitespace-pre text-foreground/85 hover:text-foreground hover:bg-primary/5 transition-colors">
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
      className: "text-muted-foreground/60 italic",
      text: match[0],
    });
  }

  while ((match = strings.exec(line)) !== null) {
    const overlaps = spans.some(s => match!.index >= s.start && match!.index < s.end);
    if (!overlaps) {
      spans.push({
        start: match.index,
        end: match.index + match[0].length,
        className: "text-neon-green",
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
        className: "text-neon-yellow",
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
        className: "text-neon-magenta font-medium",
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
        <span className="text-muted-foreground/60 italic">{comment[0]}</span>
      </>
    );
  }

  if (keyMatch) {
    const [, indent, key, colon] = keyMatch;
    const rest = line.slice(keyMatch[0].length);
    return (
      <>
        {indent}
        <span className="text-neon-cyan">{key}</span>
        <span className="text-foreground">{colon}</span>
        <span className="text-neon-green">{rest}</span>
      </>
    );
  }

  return line;
}

function highlightXml(line: string): React.ReactNode {
  const tagPattern = /<\/?[\w-]+/g;
  const attrPattern = /\s[\w-]+=/g;
  const valuePattern = /"[^"]*"/g;

  let result = line;
  
  result = line.replace(tagPattern, (match) => `<span class="text-neon-cyan">${match}</span>`);
  
  return <span dangerouslySetInnerHTML={{ __html: result }} />;
}
