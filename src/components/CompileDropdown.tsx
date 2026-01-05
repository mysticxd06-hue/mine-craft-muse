import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Play, ChevronDown, Terminal, Package, Hammer, Copy, Check } from "lucide-react";
import { PluginFile, getPluginName } from "@/lib/pluginExport";

type BuildTool = "javac" | "maven" | "gradle";

interface CompileDropdownProps {
  pluginFiles: PluginFile[];
  disabled?: boolean;
}

export function CompileDropdown({ pluginFiles, disabled }: CompileDropdownProps) {
  const [selectedTool, setSelectedTool] = useState<BuildTool | null>(null);
  const [copied, setCopied] = useState(false);

  const pluginName = getPluginName(pluginFiles);
  
  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buildInstructions: Record<BuildTool, { title: string; icon: React.ReactNode; steps: string[]; command: string; extraFile?: { name: string; content: string } }> = {
    javac: {
      title: "Compile with javac",
      icon: <Terminal className="h-4 w-4" />,
      steps: [
        "Extract the plugin ZIP to a folder",
        "Download the Spigot/Paper API JAR",
        "Open a terminal in the plugin folder",
        "Run the compile command below",
        "The compiled JAR will be in the output folder"
      ],
      command: `# Create output directory
mkdir -p out

# Compile all Java files
javac -cp "spigot-api.jar" -d out $(find src -name "*.java")

# Create the plugin JAR
cd out
jar cvf ../${pluginName}.jar *
cd ..
cp src/main/resources/* out/ 2>/dev/null || true
jar cvf ${pluginName}.jar -C out .`,
    },
    maven: {
      title: "Compile with Maven",
      icon: <Package className="h-4 w-4" />,
      steps: [
        "Extract the plugin ZIP to a folder",
        "Make sure Maven is installed (mvn --version)",
        "Open a terminal in the plugin folder",
        "Run the compile command below",
        "Find your JAR in the target/ folder"
      ],
      command: `mvn clean package`,
      extraFile: {
        name: "pom.xml",
        content: `<?xml version="1.0" encoding="UTF-8"?>
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
            </plugin>
        </plugins>
        <resources>
            <resource>
                <directory>src/main/resources</directory>
                <filtering>true</filtering>
            </resource>
        </resources>
    </build>
</project>`
      }
    },
    gradle: {
      title: "Compile with Gradle",
      icon: <Hammer className="h-4 w-4" />,
      steps: [
        "Extract the plugin ZIP to a folder",
        "Make sure Gradle is installed (gradle --version)",
        "Open a terminal in the plugin folder",
        "Run the compile command below",
        "Find your JAR in build/libs/ folder"
      ],
      command: `gradle build`,
      extraFile: {
        name: "build.gradle",
        content: `plugins {
    id 'java'
}

group = 'com.example'
version = '1.0.0'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

repositories {
    mavenCentral()
    maven { url = 'https://hub.spigotmc.org/nexus/content/repositories/snapshots/' }
    maven { url = 'https://repo.papermc.io/repository/maven-public/' }
}

dependencies {
    compileOnly 'org.spigotmc:spigot-api:1.20.4-R0.1-SNAPSHOT'
}

processResources {
    filesMatching('plugin.yml') {
        expand project.properties
    }
}

jar {
    archiveBaseName = '${pluginName}'
}`
      }
    }
  };

  const currentInstructions = selectedTool ? buildInstructions[selectedTool] : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm" disabled={disabled}>
            <Play className="h-4 w-4 mr-1.5" />
            Compile
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setSelectedTool("javac")}>
            <Terminal className="h-4 w-4 mr-2" />
            Compile with javac
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSelectedTool("maven")}>
            <Package className="h-4 w-4 mr-2" />
            Compile with Maven
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSelectedTool("gradle")}>
            <Hammer className="h-4 w-4 mr-2" />
            Compile with Gradle
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!selectedTool} onOpenChange={(open) => !open && setSelectedTool(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {currentInstructions?.icon}
              {currentInstructions?.title}
            </DialogTitle>
            <DialogDescription>
              Follow these steps to compile your plugin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Steps */}
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Steps:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                {currentInstructions?.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Command */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">Command:</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(currentInstructions?.command || "")}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <pre className="bg-secondary p-3 rounded-lg text-sm font-mono overflow-x-auto text-foreground/90">
                {currentInstructions?.command}
              </pre>
            </div>

            {/* Extra build file */}
            {currentInstructions?.extraFile && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">
                    Add this {currentInstructions.extraFile.name} to your project root:
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(currentInstructions.extraFile?.content || "")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <pre className="bg-secondary p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-64 text-foreground/90">
                  {currentInstructions.extraFile.content}
                </pre>
              </div>
            )}

            {/* Tip */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <p className="text-sm text-foreground">
                <strong>Tip:</strong> You can ask the AI to include the {selectedTool === "maven" ? "pom.xml" : selectedTool === "gradle" ? "build.gradle" : "build script"} in your plugin export by saying "add {selectedTool} build file".
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
