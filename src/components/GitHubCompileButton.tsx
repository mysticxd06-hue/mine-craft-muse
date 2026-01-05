import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Github, Download, ExternalLink, Copy, Check, ChevronDown, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { PluginFile, getPluginName } from "@/lib/pluginExport";
import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";

interface GitHubCompileButtonProps {
  pluginFiles: PluginFile[];
  disabled?: boolean;
}

interface CompilationResult {
  file: string;
  success: boolean;
  output: string;
}

export function GitHubCompileButton({ pluginFiles, disabled }: GitHubCompileButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showCompileDialog, setShowCompileDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationResults, setCompilationResults] = useState<CompilationResult[]>([]);
  const [compilationMessage, setCompilationMessage] = useState("");

  const pluginName = getPluginName(pluginFiles);

  const generatePomXml = () => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>${pluginName.toLowerCase()}</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>${pluginName}</name>

    <properties>
        <java.version>17</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <repositories>
        <repository>
            <id>spigotmc-repo</id>
            <url>https://hub.spigotmc.org/nexus/content/repositories/snapshots/</url>
        </repository>
        <repository>
            <id>papermc-repo</id>
            <url>https://repo.papermc.io/repository/maven-public/</url>
        </repository>
    </repositories>

    <dependencies>
        <dependency>
            <groupId>org.spigotmc</groupId>
            <artifactId>spigot-api</artifactId>
            <version>1.20.4-R0.1-SNAPSHOT</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>\${java.version}</source>
                    <target>\${java.version}</target>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
                <version>3.3.0</version>
                <configuration>
                    <finalName>${pluginName}</finalName>
                </configuration>
            </plugin>
        </plugins>
        <resources>
            <resource>
                <directory>src/main/resources</directory>
                <filtering>true</filtering>
            </resource>
        </resources>
    </build>
</project>`;
  };

  const generateGitHubWorkflow = () => {
    return `name: Build Plugin

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
        cache: maven
    
    - name: Build with Maven
      run: mvn clean package --file pom.xml
    
    - name: Upload Plugin JAR
      uses: actions/upload-artifact@v4
      with:
        name: ${pluginName}
        path: target/${pluginName}.jar
        retention-days: 30

  release:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master')
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
        cache: maven
    
    - name: Build with Maven
      run: mvn clean package --file pom.xml
    
    - name: Create Release
      uses: softprops/action-gh-release@v1
      with:
        tag_name: v1.0.\${{ github.run_number }}
        name: Release v1.0.\${{ github.run_number }}
        files: target/${pluginName}.jar
        generate_release_notes: true
      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}`;
  };

  const handleExportWithGitHub = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();

      // Add all plugin files
      for (const file of pluginFiles) {
        zip.file(file.path, file.content);
      }

      // Add pom.xml if not present
      const hasPom = pluginFiles.some(f => f.path === "pom.xml");
      if (!hasPom) {
        zip.file("pom.xml", generatePomXml());
      }

      // Add GitHub Actions workflow
      zip.file(".github/workflows/build.yml", generateGitHubWorkflow());

      // Add README with instructions
      const readme = `# ${pluginName}

A Minecraft plugin generated with Plugin Craftsman.

## Auto-Compile with GitHub Actions

This project includes a GitHub Actions workflow that automatically compiles your plugin.

### How to use:

1. **Create a new GitHub repository**
   - Go to [github.com/new](https://github.com/new)
   - Create a new repository (public or private)

2. **Upload this code**
   - Extract this ZIP
   - Push the contents to your new repository:
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   \`\`\`

3. **Download your compiled JAR**
   - Go to the "Actions" tab in your repository
   - Click on the latest workflow run
   - Download the artifact (${pluginName}.jar)

### Automatic Releases

Every push to the main branch will also create a GitHub Release with your compiled JAR attached!

## Building Locally

If you prefer to build locally:

\`\`\`bash
mvn clean package
\`\`\`

Your JAR will be in the \`target/\` folder.
`;
      zip.file("README.md", readme);

      // Generate and download
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pluginName}-github.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowDialog(true);
    } finally {
      setIsExporting(false);
    }
  };

  const handleJDoodleCompile = async () => {
    setIsCompiling(true);
    setCompilationResults([]);
    setCompilationMessage("");
    setShowCompileDialog(true);

    try {
      const { data, error } = await supabase.functions.invoke('compile-plugin', {
        body: {
          files: pluginFiles,
          pluginName,
        },
      });

      if (error) {
        setCompilationMessage(`Error: ${error.message}`);
        return;
      }

      setCompilationResults(data.results || []);
      setCompilationMessage(data.message || (data.success ? 'Compilation successful!' : 'Compilation failed.'));
    } catch (err) {
      setCompilationMessage(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const gitCommands = `git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main`;

  const isLoading = isExporting || isCompiling;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="sm"
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1.5" />
            )}
            {isCompiling ? "Compiling..." : isExporting ? "Preparing..." : "Compile"}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleJDoodleCompile}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Check Syntax (JDoodle)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportWithGitHub}>
            <Github className="h-4 w-4 mr-2" />
            Export for GitHub Actions
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* JDoodle Compilation Results Dialog */}
      <Dialog open={showCompileDialog} onOpenChange={setShowCompileDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isCompiling ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : compilationResults.every(r => r.success) ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              {isCompiling ? "Checking Syntax..." : "Compilation Results"}
            </DialogTitle>
            <DialogDescription>
              {isCompiling ? "Verifying your plugin code with JDoodle..." : compilationMessage}
            </DialogDescription>
          </DialogHeader>

          {!isCompiling && compilationResults.length > 0 && (
            <div className="space-y-3 mt-4 max-h-64 overflow-y-auto">
              {compilationResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${result.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-destructive/10 border border-destructive/20'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-sm font-medium">{result.file}</span>
                  </div>
                  <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                    {result.output.slice(0, 500)}{result.output.length > 500 ? '...' : ''}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {!isCompiling && (
            <div className="bg-muted/50 border rounded-lg p-3 mt-2">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> JDoodle checks syntax but can't produce a full Minecraft plugin JAR due to Spigot API dependencies. Use "Export for GitHub Actions" for a compiled JAR.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* GitHub Export Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              ZIP Downloaded!
            </DialogTitle>
            <DialogDescription>
              Follow these steps to get your compiled JAR
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  1
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Create a GitHub repository</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("https://github.com/new", "_blank")}
                  >
                    <ExternalLink className="h-3 w-3 mr-1.5" />
                    github.com/new
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  2
                </div>
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium text-foreground">Extract ZIP & push to GitHub</p>
                  <div className="relative">
                    <pre className="bg-background p-2 rounded text-xs font-mono overflow-x-auto text-muted-foreground">
                      {gitCommands}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => handleCopy(gitCommands)}
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-primary" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  3
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Download compiled JAR</p>
                  <p className="text-xs text-muted-foreground">
                    Go to your repo → Actions tab → Click latest run → Download artifact
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <p className="text-sm text-foreground">
                <strong>Bonus:</strong> Every push to main automatically creates a GitHub Release with your JAR attached!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
