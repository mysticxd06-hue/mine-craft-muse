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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Github, Download, ExternalLink, Copy, Check, ChevronDown, Loader2, AlertCircle, CheckCircle, Package, Terminal } from "lucide-react";
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

type JavaVersion = "17" | "21";
type MinecraftVersion = "1.20.4" | "1.21" | "1.21.4";
type ServerAPI = "spigot" | "paper";

const MC_JAVA_COMPATIBILITY: Record<MinecraftVersion, JavaVersion[]> = {
  "1.20.4": ["17", "21"],
  "1.21": ["21"],
  "1.21.4": ["21"],
};

const SERVER_API_LABELS: Record<ServerAPI, string> = {
  "spigot": "Spigot API",
  "paper": "Paper API (Paperweight)",
};

export function GitHubCompileButton({ pluginFiles, disabled }: GitHubCompileButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showCompileDialog, setShowCompileDialog] = useState(false);
  const [showLocalCompileDialog, setShowLocalCompileDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isLocalExporting, setIsLocalExporting] = useState(false);
  const [compilationResults, setCompilationResults] = useState<CompilationResult[]>([]);
  const [compilationMessage, setCompilationMessage] = useState("");
  
  // Configuration state
  const [javaVersion, setJavaVersion] = useState<JavaVersion>("21");
  const [mcVersion, setMcVersion] = useState<MinecraftVersion>("1.21.4");
  const [serverAPI, setServerAPI] = useState<ServerAPI>("paper");

  const pluginName = getPluginName(pluginFiles);

  const generatePomXml = (java: JavaVersion, mc: MinecraftVersion, api: ServerAPI) => {
    const isPaper = api === "paper";
    
    const dependency = isPaper
      ? `        <dependency>
            <groupId>io.papermc.paper</groupId>
            <artifactId>paper-api</artifactId>
            <version>${mc}-R0.1-SNAPSHOT</version>
            <scope>provided</scope>
        </dependency>`
      : `        <dependency>
            <groupId>org.spigotmc</groupId>
            <artifactId>spigot-api</artifactId>
            <version>${mc}-R0.1-SNAPSHOT</version>
            <scope>provided</scope>
        </dependency>`;

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
        <java.version>${java}</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <repositories>
        <repository>
            <id>papermc-repo</id>
            <url>https://repo.papermc.io/repository/maven-public/</url>
        </repository>
        <repository>
            <id>spigotmc-repo</id>
            <url>https://hub.spigotmc.org/nexus/content/repositories/snapshots/</url>
        </repository>
    </repositories>

    <dependencies>
${dependency}
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.13.0</version>
                <configuration>
                    <source>\${java.version}</source>
                    <target>\${java.version}</target>
                    <release>\${java.version}</release>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
                <version>3.4.2</version>
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

  const generateGitHubWorkflow = (java: JavaVersion) => {
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
    
    - name: Set up JDK ${java}
      uses: actions/setup-java@v4
      with:
        java-version: '${java}'
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
    
    - name: Set up JDK ${java}
      uses: actions/setup-java@v4
      with:
        java-version: '${java}'
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

      // Add all plugin files (but update plugin.yml api-version based on MC version)
      for (const file of pluginFiles) {
        if (file.path.endsWith('plugin.yml')) {
          // Update api-version in plugin.yml
          const apiVersion = mcVersion.substring(0, 4); // e.g., "1.21" from "1.21.4"
          const updatedContent = file.content.replace(
            /api-version:\s*['"]?[\d.]+['"]?/,
            `api-version: '${apiVersion}'`
          );
          zip.file(file.path, updatedContent);
        } else {
          zip.file(file.path, file.content);
        }
      }

      // Add pom.xml (always generate fresh with correct versions)
      zip.file("pom.xml", generatePomXml(javaVersion, mcVersion, serverAPI));

      // Add GitHub Actions workflow
      zip.file(".github/workflows/build.yml", generateGitHubWorkflow(javaVersion));

      // Add README with instructions
      const readme = `# ${pluginName}

A Minecraft plugin generated with Lunar Sky Studio.

**Target:** Minecraft ${mcVersion} | Java ${javaVersion}

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

If you prefer to build locally, ensure you have:
- Java ${javaVersion} JDK installed
- Maven installed

Then run:

\`\`\`bash
mvn clean package
\`\`\`

Your JAR will be in the \`target/\` folder.

## Compatibility

- **Minecraft Version:** ${mcVersion}
- **Java Version:** ${javaVersion}
- **Server Software:** Spigot, Paper, Purpur (any Bukkit-based server)
`;
      zip.file("README.md", readme);

      // Generate and download
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pluginName}-java${javaVersion}-mc${mcVersion}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowDialog(true);
    } finally {
      setIsExporting(false);
    }
  };

  const generateBuildScript = (isWindows: boolean, java: JavaVersion) => {
    if (isWindows) {
      return `@echo off
echo =======================================
echo   ${pluginName} - Plugin Compiler
echo   Java ${java} / Minecraft ${mcVersion}
echo =======================================
echo.

REM Check if Maven is installed
where mvn >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Maven is not installed or not in PATH!
    echo.
    echo Please install Maven:
    echo   1. Download from: https://maven.apache.org/download.cgi
    echo   2. Extract and add bin folder to PATH
    echo   3. Run this script again
    echo.
    pause
    exit /b 1
)

REM Check if Java is installed
where java >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Java is not installed or not in PATH!
    echo.
    echo Please install Java ${java}:
    echo   Download from: https://adoptium.net/
    echo.
    pause
    exit /b 1
)

echo [INFO] Building ${pluginName}...
echo.

call mvn clean package -q

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =======================================
    echo   BUILD SUCCESSFUL!
    echo =======================================
    echo.
    echo Your plugin JAR is ready at:
    echo   target\\${pluginName}.jar
    echo.
    echo Copy it to your server's plugins folder!
    echo.
    
    REM Open the target folder
    start "" "target"
) else (
    echo.
    echo [ERROR] Build failed! Check the errors above.
)

pause
`;
    } else {
      return `#!/bin/bash

echo "======================================="
echo "  ${pluginName} - Plugin Compiler"
echo "  Java ${java} / Minecraft ${mcVersion}"
echo "======================================="
echo ""

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "[ERROR] Maven is not installed!"
    echo ""
    echo "Please install Maven:"
    echo "  macOS: brew install maven"
    echo "  Linux: sudo apt install maven"
    echo ""
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "[ERROR] Java is not installed!"
    echo ""
    echo "Please install Java ${java}:"
    echo "  Download from: https://adoptium.net/"
    echo ""
    exit 1
fi

echo "[INFO] Building ${pluginName}..."
echo ""

mvn clean package -q

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================="
    echo "  BUILD SUCCESSFUL!"
    echo "======================================="
    echo ""
    echo "Your plugin JAR is ready at:"
    echo "  target/${pluginName}.jar"
    echo ""
    echo "Copy it to your server's plugins folder!"
    
    # Open the target folder (macOS only)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open target/
    fi
else
    echo ""
    echo "[ERROR] Build failed! Check the errors above."
    exit 1
fi
`;
    }
  };

  const handleLocalCompileExport = async () => {
    setIsLocalExporting(true);
    try {
      const zip = new JSZip();

      // Add all plugin files (but update plugin.yml api-version based on MC version)
      for (const file of pluginFiles) {
        if (file.path.endsWith('plugin.yml')) {
          const apiVersion = mcVersion.substring(0, 4);
          const updatedContent = file.content.replace(
            /api-version:\s*['"]?[\d.]+['"]?/,
            `api-version: '${apiVersion}'`
          );
          zip.file(file.path, updatedContent);
        } else {
          zip.file(file.path, file.content);
        }
      }

      // Add pom.xml
      zip.file("pom.xml", generatePomXml(javaVersion, mcVersion, serverAPI));

      // Add build scripts
      zip.file("BUILD.bat", generateBuildScript(true, javaVersion));
      zip.file("build.sh", generateBuildScript(false, javaVersion));

      // Add README
      const readme = `# ${pluginName}

A Minecraft plugin generated with Lunar Sky Studio.

**Target:** Minecraft ${mcVersion} | Java ${javaVersion}

## One-Click Compile

### Windows
Double-click \`BUILD.bat\` to compile your plugin.

### macOS / Linux
1. Open Terminal in this folder
2. Run: \`chmod +x build.sh && ./build.sh\`

## Requirements

- **Java ${javaVersion}**: Download from [Adoptium](https://adoptium.net/)
- **Maven**: 
  - Windows: [Download](https://maven.apache.org/download.cgi) and add to PATH
  - macOS: \`brew install maven\`
  - Linux: \`sudo apt install maven\`

## Output

After building, your plugin will be at:
\`\`\`
target/${pluginName}.jar
\`\`\`

Copy this JAR to your Minecraft server's \`plugins\` folder!
`;
      zip.file("README.md", readme);

      // Generate and download
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pluginName}-compile-ready.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowLocalCompileDialog(true);
    } finally {
      setIsLocalExporting(false);
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
          javaVersion,
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

  const isLoading = isExporting || isCompiling || isLocalExporting;

  // Check Java compatibility when MC version changes
  const handleMcVersionChange = (mc: MinecraftVersion) => {
    setMcVersion(mc);
    const compatible = MC_JAVA_COMPATIBILITY[mc];
    if (!compatible.includes(javaVersion)) {
      setJavaVersion(compatible[0]);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="sm"
            disabled={disabled || isLoading}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Package className="h-4 w-4 mr-1.5" />
            )}
            {isCompiling ? "Checking..." : isExporting || isLocalExporting ? "Preparing..." : "Build"}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {SERVER_API_LABELS[serverAPI]} • Java {javaVersion} • MC {mcVersion}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span>Server API</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setServerAPI("paper")}>
                <Check className={`h-4 w-4 mr-2 ${serverAPI === "paper" ? "opacity-100" : "opacity-0"}`} />
                Paper API (Recommended)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setServerAPI("spigot")}>
                <Check className={`h-4 w-4 mr-2 ${serverAPI === "spigot" ? "opacity-100" : "opacity-0"}`} />
                Spigot API
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span>Minecraft Version</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleMcVersionChange("1.21.4")}>
                <Check className={`h-4 w-4 mr-2 ${mcVersion === "1.21.4" ? "opacity-100" : "opacity-0"}`} />
                1.21.4 (Latest)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMcVersionChange("1.21")}>
                <Check className={`h-4 w-4 mr-2 ${mcVersion === "1.21" ? "opacity-100" : "opacity-0"}`} />
                1.21
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMcVersionChange("1.20.4")}>
                <Check className={`h-4 w-4 mr-2 ${mcVersion === "1.20.4" ? "opacity-100" : "opacity-0"}`} />
                1.20.4
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span>Java Version</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem 
                onClick={() => setJavaVersion("21")}
                disabled={!MC_JAVA_COMPATIBILITY[mcVersion].includes("21")}
              >
                <Check className={`h-4 w-4 mr-2 ${javaVersion === "21" ? "opacity-100" : "opacity-0"}`} />
                Java 21 (Recommended)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setJavaVersion("17")}
                disabled={!MC_JAVA_COMPATIBILITY[mcVersion].includes("17")}
              >
                <Check className={`h-4 w-4 mr-2 ${javaVersion === "17" ? "opacity-100" : "opacity-0"}`} />
                Java 17
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleLocalCompileExport}>
            <Download className="h-4 w-4 mr-2" />
            Download & Compile Locally
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleJDoodleCompile}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Check Syntax
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleExportWithGitHub}>
            <Github className="h-4 w-4 mr-2" />
            Export for GitHub
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
              ) : compilationResults.every(r => r.success) && compilationResults.length > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              {isCompiling ? "Checking Syntax..." : "Syntax Check Results"}
            </DialogTitle>
            <DialogDescription>
              {isCompiling ? `Verifying your plugin code (Java ${javaVersion})...` : compilationMessage}
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
            <div className="bg-muted/50 border rounded-lg p-3 mt-2 space-y-2">
              <p className="text-sm font-medium text-foreground">To get a compiled JAR:</p>
              <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
                <li>Use "Export for GitHub" to download the project</li>
                <li>Push to a GitHub repository</li>
                <li>GitHub Actions will auto-compile and create releases</li>
              </ol>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => {
                  setShowCompileDialog(false);
                  handleExportWithGitHub();
                }}
              >
                <Github className="h-4 w-4 mr-2" />
                Export for GitHub
              </Button>
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
              Java {javaVersion} • Minecraft {mcVersion} — Follow these steps to compile
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
                <strong>✨ Auto-Release:</strong> Every push to main creates a GitHub Release with your compiled JAR!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Local Compile Dialog */}
      <Dialog open={showLocalCompileDialog} onOpenChange={setShowLocalCompileDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Ready to Compile!
            </DialogTitle>
            <DialogDescription>
              Java {javaVersion} • Minecraft {mcVersion}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  1
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Extract the ZIP file</p>
                  <p className="text-xs text-muted-foreground">
                    Unzip the downloaded file to any folder
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  2
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Run the build script</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Windows:</strong> Double-click <code className="bg-background px-1 rounded">BUILD.bat</code></p>
                    <p><strong>Mac/Linux:</strong> Run <code className="bg-background px-1 rounded">./build.sh</code></p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  3
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Get your JAR!</p>
                  <p className="text-xs text-muted-foreground">
                    Find <code className="bg-background px-1 rounded">{pluginName}.jar</code> in the <code className="bg-background px-1 rounded">target</code> folder
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 border rounded-lg p-3">
              <p className="text-sm font-medium text-foreground mb-2">Requirements:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <a href="https://adoptium.net/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Java {javaVersion}</a></li>
                <li>• <a href="https://maven.apache.org/download.cgi" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Maven</a></li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
