import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
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
import { Github, Download, ExternalLink, Copy, Check, ChevronDown, Loader2, AlertCircle, CheckCircle, Package, Terminal, Hammer, Wrench, Server } from "lucide-react";
import { PluginFile, getPluginName } from "@/lib/pluginExport";
import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";
import { toast } from "sonner";

interface GitHubCompileButtonProps {
  pluginFiles: PluginFile[];
  disabled?: boolean;
}

interface CompilationResult {
  file: string;
  success: boolean;
  output: string;
}

type JavaVersion = "8" | "11" | "16" | "17" | "21";
type MinecraftVersion = 
  | "1.8.8" | "1.9.4" | "1.10.2" | "1.11.2" | "1.12.2" 
  | "1.13.2" | "1.14.4" | "1.15.2" | "1.16.5" | "1.17.1" 
  | "1.18.2" | "1.19.4" | "1.20.4" | "1.20.6" 
  | "1.21" | "1.21.1" | "1.21.4";
type ServerAPI = "spigot" | "paper" | "buildtools";
type BuildTool = "maven" | "gradle" | "javac";

const BUILD_TOOL_LABELS: Record<BuildTool, { name: string; description: string }> = {
  "maven": { name: "Maven", description: "Apache Maven - Most common for plugins" },
  "gradle": { name: "Gradle", description: "Gradle - Modern, fast builds" },
  "javac": { name: "javac", description: "Direct Java compiler - Simple plugins" },
};

// Java compatibility based on Minecraft version requirements
const MC_JAVA_COMPATIBILITY: Record<MinecraftVersion, JavaVersion[]> = {
  "1.8.8": ["8"],
  "1.9.4": ["8"],
  "1.10.2": ["8"],
  "1.11.2": ["8"],
  "1.12.2": ["8"],
  "1.13.2": ["8"],
  "1.14.4": ["8", "11"],
  "1.15.2": ["8", "11"],
  "1.16.5": ["8", "11", "16"],
  "1.17.1": ["16", "17"],
  "1.18.2": ["17"],
  "1.19.4": ["17"],
  "1.20.4": ["17", "21"],
  "1.20.6": ["21"],
  "1.21": ["21"],
  "1.21.1": ["21"],
  "1.21.4": ["21"],
};

// Versions grouped for UI display
const MC_VERSION_GROUPS = {
  "Latest (1.21.x)": ["1.21.4", "1.21.1", "1.21"] as MinecraftVersion[],
  "1.20.x": ["1.20.6", "1.20.4"] as MinecraftVersion[],
  "1.19.x - 1.17.x": ["1.19.4", "1.18.2", "1.17.1"] as MinecraftVersion[],
  "1.16.x - 1.13.x": ["1.16.5", "1.15.2", "1.14.4", "1.13.2"] as MinecraftVersion[],
  "Legacy (1.12.x and older)": ["1.12.2", "1.11.2", "1.10.2", "1.9.4", "1.8.8"] as MinecraftVersion[],
};

const SERVER_API_LABELS: Record<ServerAPI, string> = {
  "spigot": "Spigot API",
  "paper": "Paper API",
  "buildtools": "Spigot BuildTools",
};

// Paper API only supports 1.16.5+
const PAPER_SUPPORTED_VERSIONS: MinecraftVersion[] = [
  "1.16.5", "1.17.1", "1.18.2", "1.19.4", "1.20.4", "1.20.6", "1.21", "1.21.1", "1.21.4"
];

export function GitHubCompileButton({ pluginFiles, disabled }: GitHubCompileButtonProps) {
  const navigate = useNavigate();
  const { user, loading, profile } = useAuthContext();

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
  const [buildTool, setBuildTool] = useState<BuildTool>("maven");
  const [showBuildToolsDialog, setShowBuildToolsDialog] = useState(false);
  const [isBuildToolsExporting, setIsBuildToolsExporting] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildErrors, setBuildErrors] = useState<string[]>([]);
  const [showBuildErrorDialog, setShowBuildErrorDialog] = useState(false);
  const [showBuildServerDialog, setShowBuildServerDialog] = useState(false);
  const [buildServerUrl, setBuildServerUrl] = useState(() => localStorage.getItem('buildServerUrl') || '');
  const [isBuildServerCompiling, setIsBuildServerCompiling] = useState(false);

  const pluginName = getPluginName(pluginFiles);

  const generatePomXml = (java: JavaVersion, mc: MinecraftVersion, api: ServerAPI) => {
    const isPaper = api === "paper";
    const isBuildTools = api === "buildtools";
    
    // For BuildTools, we compile against the full spigot jar (not just API)
    const dependency = isPaper
      ? `        <dependency>
            <groupId>io.papermc.paper</groupId>
            <artifactId>paper-api</artifactId>
            <version>${mc}-R0.1-SNAPSHOT</version>
            <scope>provided</scope>
        </dependency>`
      : isBuildTools
      ? `        <dependency>
            <groupId>org.spigotmc</groupId>
            <artifactId>spigot</artifactId>
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
      a.download = `${pluginName}-OneClickBuild.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded! Extract and run BUILD.bat (Windows) or build.sh (Mac/Linux) to get ${pluginName}.jar`, { duration: 8000 });
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

  // Compile: use custom build server to get JAR
  const handleDirectCompile = async () => {
    if (loading) return;

    if (!user) {
      toast.error("Sign in required to compile");
      navigate('/auth');
      return;
    }

    if ((profile as any)?.is_banned) {
      toast.error("Account restricted");
      return;
    }

    // Show build server configuration dialog
    setShowBuildServerDialog(true);
  };

  // Send code to custom build server and download the JAR
  const handleBuildServerCompile = async () => {
    if (!buildServerUrl.trim()) {
      toast.error("Please enter your build server URL");
      return;
    }

    // Save URL for future use
    localStorage.setItem('buildServerUrl', buildServerUrl.trim());

    setIsBuildServerCompiling(true);
    try {
      // Prepare the payload
      const apiVersion = mcVersion.substring(0, 4);
      const filesPayload = pluginFiles.map(file => {
        if (file.path.endsWith('plugin.yml')) {
          const updatedContent = file.content.replace(
            /api-version:\s*['"]?[\d.]+['"]?/,
            `api-version: '${apiVersion}'`
          );
          return { path: file.path, content: updatedContent };
        }
        return { path: file.path, content: file.content };
      });

      // Add pom.xml
      filesPayload.push({
        path: "pom.xml",
        content: generatePomXml(javaVersion, mcVersion, serverAPI),
      });

      const payload = {
        pluginName,
        javaVersion,
        mcVersion,
        serverAPI,
        buildTool,
        files: filesPayload,
      };

      toast.info("Sending code to build server...");

      const response = await fetch(buildServerUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Build server error (${response.status}): ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/java-archive') || contentType?.includes('application/octet-stream') || contentType?.includes('application/zip')) {
        // Server returned a JAR file directly
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${pluginName}.jar`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(`${pluginName}.jar downloaded successfully!`);
        setShowBuildServerDialog(false);
      } else {
        // Check if it's JSON response with download URL or error
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (data.downloadUrl) {
          // Server returned a URL to download the JAR
          window.open(data.downloadUrl, '_blank');
          toast.success("Download started!");
          setShowBuildServerDialog(false);
        } else if (data.jarBase64) {
          // Server returned the JAR as base64
          const binaryString = atob(data.jarBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/java-archive' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${pluginName}.jar`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast.success(`${pluginName}.jar downloaded successfully!`);
          setShowBuildServerDialog(false);
        } else {
          throw new Error("Unexpected response format from build server");
        }
      }
    } catch (err) {
      console.error("Build server error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to compile. Check your build server.");
    } finally {
      setIsBuildServerCompiling(false);
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


  // Check Java compatibility when MC version changes
  const handleMcVersionChange = (mc: MinecraftVersion) => {
    setMcVersion(mc);
    const compatible = MC_JAVA_COMPATIBILITY[mc];
    if (!compatible.includes(javaVersion)) {
      setJavaVersion(compatible[0]);
    }
    // Switch to buildtools/spigot if Paper doesn't support this version
    if (serverAPI === "paper" && !PAPER_SUPPORTED_VERSIONS.includes(mc)) {
      setServerAPI("spigot");
    }
  };

  // Generate BuildTools scripts
  const generateBuildToolsScript = (isWindows: boolean, java: JavaVersion, mc: MinecraftVersion) => {
    if (isWindows) {
      return `@echo off
echo =======================================
echo   ${pluginName} - Spigot BuildTools Compiler
echo   Java ${java} / Minecraft ${mc}
echo =======================================
echo.

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

REM Create BuildTools directory
if not exist "buildtools" mkdir buildtools
cd buildtools

REM Download BuildTools if not present
if not exist "BuildTools.jar" (
    echo [INFO] Downloading Spigot BuildTools...
    curl -o BuildTools.jar https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/artifact/target/BuildTools.jar
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to download BuildTools. Please download manually:
        echo   https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/artifact/target/BuildTools.jar
        pause
        exit /b 1
    )
)

echo [INFO] Running BuildTools for Minecraft ${mc}...
echo This may take 10-30 minutes on first run...
echo.

java -jar BuildTools.jar --rev ${mc}

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] BuildTools failed!
    pause
    exit /b 1
)

cd ..

echo.
echo [INFO] BuildTools complete! Now building plugin...
echo.

REM Check if Maven is installed
where mvn >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Maven is not installed!
    echo Please install Maven: https://maven.apache.org/download.cgi
    pause
    exit /b 1
)

call mvn clean package -q

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =======================================
    echo   BUILD SUCCESSFUL!
    echo =======================================
    echo.
    echo Your plugin JAR is at: target\\${pluginName}.jar
    start "" "target"
) else (
    echo [ERROR] Build failed!
)

pause
`;
    } else {
      return `#!/bin/bash

echo "======================================="
echo "  ${pluginName} - Spigot BuildTools Compiler"
echo "  Java ${java} / Minecraft ${mc}"
echo "======================================="
echo ""

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "[ERROR] Java is not installed!"
    echo "Please install Java ${java}: https://adoptium.net/"
    exit 1
fi

# Create BuildTools directory
mkdir -p buildtools
cd buildtools

# Download BuildTools if not present
if [ ! -f "BuildTools.jar" ]; then
    echo "[INFO] Downloading Spigot BuildTools..."
    curl -o BuildTools.jar https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/artifact/target/BuildTools.jar
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to download BuildTools."
        exit 1
    fi
fi

echo "[INFO] Running BuildTools for Minecraft ${mc}..."
echo "This may take 10-30 minutes on first run..."
echo ""

java -jar BuildTools.jar --rev ${mc}

if [ $? -ne 0 ]; then
    echo "[ERROR] BuildTools failed!"
    exit 1
fi

cd ..

echo ""
echo "[INFO] BuildTools complete! Now building plugin..."
echo ""

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "[ERROR] Maven is not installed!"
    echo "Please install Maven: https://maven.apache.org/download.cgi"
    exit 1
fi

mvn clean package -q

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================="
    echo "  BUILD SUCCESSFUL!"
    echo "======================================="
    echo ""
    echo "Your plugin JAR is at: target/${pluginName}.jar"
else
    echo "[ERROR] Build failed!"
    exit 1
fi
`;
    }
  };

  const handleBuildToolsExport = async () => {
    setIsBuildToolsExporting(true);
    try {
      const zip = new JSZip();

      // Add all plugin files
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

      // Add pom.xml for BuildTools
      zip.file("pom.xml", generatePomXml(javaVersion, mcVersion, "buildtools"));

      // Add BuildTools scripts
      zip.file("BUILD_WITH_BUILDTOOLS.bat", generateBuildToolsScript(true, javaVersion, mcVersion));
      zip.file("build_with_buildtools.sh", generateBuildToolsScript(false, javaVersion, mcVersion));

      // Add README
      const readme = `# ${pluginName} - Spigot BuildTools Edition

A Minecraft plugin generated with Lunar Sky Studio.

**Target:** Minecraft ${mcVersion} | Java ${javaVersion}

## What is BuildTools?

BuildTools is Spigot's official tool that compiles Spigot/CraftBukkit from source.
It ensures you have the exact server JAR for your Minecraft version, and installs
the Spigot API to your local Maven repository for plugin compilation.

## One-Click Compile

### Windows
Double-click \`BUILD_WITH_BUILDTOOLS.bat\`

### macOS / Linux
\`\`\`bash
chmod +x build_with_buildtools.sh
./build_with_buildtools.sh
\`\`\`

## What Happens

1. **BuildTools downloads** (first run only)
2. **BuildTools compiles Spigot ${mcVersion}** (10-30 min first run, cached after)
3. **Your plugin compiles** against the local Spigot JAR
4. **Plugin JAR created** in \`target/${pluginName}.jar\`

## Requirements

- **Java ${javaVersion}**: [Download from Adoptium](https://adoptium.net/)
- **Maven**: [Download](https://maven.apache.org/download.cgi)
- **Git**: Required by BuildTools - [Download](https://git-scm.com/)

## Why Use BuildTools?

- ✅ Works with ALL Minecraft versions (1.8 - ${mcVersion})
- ✅ Compiles against full Spigot (not just API)
- ✅ Access to NMS/CraftBukkit internals
- ✅ Official Spigot-recommended method

## Output

\`\`\`
target/${pluginName}.jar
\`\`\`

Copy this to your server's \`plugins\` folder!
`;
      zip.file("README.md", readme);

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pluginName}-buildtools-mc${mcVersion}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowBuildToolsDialog(true);
    } finally {
      setIsBuildToolsExporting(false);
    }
  };

  const isLoading = isExporting || isCompiling || isLocalExporting || isBuildToolsExporting || isBuilding || isBuildServerCompiling;

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
              <Hammer className="h-4 w-4 mr-1.5" />
            )}
            {isBuilding ? "Compiling..." : isCompiling ? "Checking..." : isExporting || isLocalExporting ? "Preparing..." : "Compile"}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {BUILD_TOOL_LABELS[buildTool].name} • {SERVER_API_LABELS[serverAPI]} • Java {javaVersion}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* COMPILE BUTTON - Primary action */}
          <DropdownMenuItem onClick={handleDirectCompile} className="font-medium" disabled={!user || loading}>
            <Hammer className="h-4 w-4 mr-2 text-primary" />
            {user ? "Compile → Get .jar" : "Sign in to compile"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          {/* Build Tool Selection */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Wrench className="h-4 w-4 mr-2" />
              <span>Build Tool: {BUILD_TOOL_LABELS[buildTool].name}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {(Object.keys(BUILD_TOOL_LABELS) as BuildTool[]).map((tool) => (
                <DropdownMenuItem key={tool} onClick={() => setBuildTool(tool)}>
                  <Check className={`h-4 w-4 mr-2 ${buildTool === tool ? "opacity-100" : "opacity-0"}`} />
                  <div className="flex flex-col">
                    <span>{BUILD_TOOL_LABELS[tool].name}</span>
                    <span className="text-xs text-muted-foreground">{BUILD_TOOL_LABELS[tool].description}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span>Server API</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem 
                onClick={() => setServerAPI("paper")}
                disabled={!PAPER_SUPPORTED_VERSIONS.includes(mcVersion)}
              >
                <Check className={`h-4 w-4 mr-2 ${serverAPI === "paper" ? "opacity-100" : "opacity-0"}`} />
                Paper API {!PAPER_SUPPORTED_VERSIONS.includes(mcVersion) && "(1.16.5+)"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setServerAPI("spigot")}>
                <Check className={`h-4 w-4 mr-2 ${serverAPI === "spigot" ? "opacity-100" : "opacity-0"}`} />
                Spigot API
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setServerAPI("buildtools")}>
                <Check className={`h-4 w-4 mr-2 ${serverAPI === "buildtools" ? "opacity-100" : "opacity-0"}`} />
                Spigot BuildTools (All versions)
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span>Minecraft Version</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
              {Object.entries(MC_VERSION_GROUPS).map(([group, versions]) => (
                <div key={group}>
                  <DropdownMenuLabel className="text-xs text-muted-foreground py-1">
                    {group}
                  </DropdownMenuLabel>
                  {versions.map((version) => (
                    <DropdownMenuItem key={version} onClick={() => handleMcVersionChange(version)}>
                      <Check className={`h-4 w-4 mr-2 ${mcVersion === version ? "opacity-100" : "opacity-0"}`} />
                      {version}
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span>Java Version</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {(["21", "17", "16", "11", "8"] as JavaVersion[]).map((java) => (
                <DropdownMenuItem 
                  key={java}
                  onClick={() => setJavaVersion(java)}
                  disabled={!MC_JAVA_COMPATIBILITY[mcVersion].includes(java)}
                >
                  <Check className={`h-4 w-4 mr-2 ${javaVersion === java ? "opacity-100" : "opacity-0"}`} />
                  Java {java} {java === "21" && "(Latest)"} {java === "8" && "(Legacy)"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs text-muted-foreground">Other Options</DropdownMenuLabel>

          {serverAPI === "buildtools" ? (
            <DropdownMenuItem onClick={handleBuildToolsExport}>
              <Download className="h-4 w-4 mr-2" />
              Download with BuildTools
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleLocalCompileExport}>
              <Download className="h-4 w-4 mr-2" />
              Download & Compile Locally
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={handleJDoodleCompile}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Check Syntax
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleExportWithGitHub} disabled={serverAPI === "buildtools"}>
            <Github className="h-4 w-4 mr-2" />
            Export for GitHub {serverAPI === "buildtools" && "(N/A)"}
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
              <Package className="h-5 w-5 text-green-500" />
              One-Click JAR Builder Downloaded!
            </DialogTitle>
            <DialogDescription>
              Run the script to get <strong>{pluginName}.jar</strong> • Java {javaVersion} • MC {mcVersion}
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

      {/* BuildTools Dialog */}
      <Dialog open={showBuildToolsDialog} onOpenChange={setShowBuildToolsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              BuildTools Package Ready!
            </DialogTitle>
            <DialogDescription>
              Java {javaVersion} • Minecraft {mcVersion} • Spigot BuildTools
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-sm text-foreground">
                <strong>⚠️ First run takes 10-30 minutes</strong> as BuildTools compiles Spigot from source. Subsequent builds are much faster!
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  1
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Extract & run the script</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Windows:</strong> <code className="bg-background px-1 rounded">BUILD_WITH_BUILDTOOLS.bat</code></p>
                    <p><strong>Mac/Linux:</strong> <code className="bg-background px-1 rounded">./build_with_buildtools.sh</code></p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  2
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Wait for compilation</p>
                  <p className="text-xs text-muted-foreground">
                    BuildTools downloads and compiles Spigot, then builds your plugin
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  3
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Get your JAR!</p>
                  <p className="text-xs text-muted-foreground">
                    Find <code className="bg-background px-1 rounded">{pluginName}.jar</code> in <code className="bg-background px-1 rounded">target/</code>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 border rounded-lg p-3">
              <p className="text-sm font-medium text-foreground mb-2">Requirements:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <a href="https://adoptium.net/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Java {javaVersion}</a></li>
                <li>• <a href="https://maven.apache.org/download.cgi" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Maven</a></li>
                <li>• <a href="https://git-scm.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Git</a> (required by BuildTools)</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Build Error Dialog */}
      <Dialog open={showBuildErrorDialog} onOpenChange={setShowBuildErrorDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Build Failed
            </DialogTitle>
            <DialogDescription>
              {buildTool.toUpperCase()} compilation failed with the following errors:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4 max-h-64 overflow-y-auto">
            {buildErrors.map((error, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                  {error}
                </pre>
              </div>
            ))}
          </div>

          <div className="bg-muted/50 border rounded-lg p-3 mt-4">
            <p className="text-sm font-medium text-foreground mb-2">Troubleshooting:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Check that class names match file names</li>
              <li>• Ensure all Java files have package declarations</li>
              <li>• Verify balanced braces and parentheses</li>
              <li>• Use "Check Syntax" for detailed error info</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      {/* Build Server Dialog */}
      <Dialog open={showBuildServerDialog} onOpenChange={setShowBuildServerDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Custom Build Server
            </DialogTitle>
            <DialogDescription>
              Enter your build server URL to compile {pluginName}.jar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Build Server URL</label>
              <input
                type="url"
                placeholder="https://your-server.com/api/compile"
                value={buildServerUrl}
                onChange={(e) => setBuildServerUrl(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                Your server should accept POST with JSON payload and return a JAR file
              </p>
            </div>

            <div className="bg-muted/50 border rounded-lg p-3">
              <p className="text-sm font-medium text-foreground mb-2">Server Requirements:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Accept POST request with JSON body</li>
                <li>• Return JAR as binary (application/java-archive)</li>
                <li>• Or return JSON with <code className="bg-background px-1 rounded">downloadUrl</code> or <code className="bg-background px-1 rounded">jarBase64</code></li>
              </ul>
            </div>

            <div className="bg-secondary/50 border rounded-lg p-3">
              <p className="text-sm font-medium text-foreground mb-2">Payload sent:</p>
              <pre className="text-xs text-muted-foreground overflow-x-auto">
{`{
  "pluginName": "${pluginName}",
  "javaVersion": "${javaVersion}",
  "mcVersion": "${mcVersion}",
  "serverAPI": "${serverAPI}",
  "buildTool": "${buildTool}",
  "files": [{ "path": "...", "content": "..." }]
}`}
              </pre>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowBuildServerDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleBuildServerCompile}
                disabled={!buildServerUrl.trim() || isBuildServerCompiling}
              >
                {isBuildServerCompiling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Compiling...
                  </>
                ) : (
                  <>
                    <Hammer className="h-4 w-4 mr-2" />
                    Compile
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
