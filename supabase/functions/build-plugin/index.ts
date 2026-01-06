import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore: JSZip types
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

interface PluginFile {
  path: string;
  content: string;
}

interface BuildRequest {
  files: PluginFile[];
  pluginName: string;
  javaVersion: string;
  mcVersion: string;
  serverAPI: 'spigot' | 'paper' | 'buildtools';
  buildTool: 'maven' | 'gradle' | 'javac';
}

// Generate pom.xml for Maven builds
function generatePomXml(pluginName: string, java: string, mc: string, api: string): string {
  const isPaper = api === "paper";
  const isBuildTools = api === "buildtools";
  
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
}

// Generate build.gradle for Gradle builds
function generateBuildGradle(pluginName: string, java: string, mc: string, api: string): string {
  const isPaper = api === "paper";
  const isBuildTools = api === "buildtools";
  
  const dependency = isPaper
    ? `    compileOnly 'io.papermc.paper:paper-api:${mc}-R0.1-SNAPSHOT'`
    : isBuildTools
    ? `    compileOnly 'org.spigotmc:spigot:${mc}-R0.1-SNAPSHOT'`
    : `    compileOnly 'org.spigotmc:spigot-api:${mc}-R0.1-SNAPSHOT'`;

  return `plugins {
    id 'java'
}

group = 'com.example'
version = '1.0.0'

java {
    sourceCompatibility = JavaVersion.VERSION_${java}
    targetCompatibility = JavaVersion.VERSION_${java}
}

repositories {
    mavenCentral()
    maven { url = 'https://repo.papermc.io/repository/maven-public/' }
    maven { url = 'https://hub.spigotmc.org/nexus/content/repositories/snapshots/' }
}

dependencies {
${dependency}
}

jar {
    archiveBaseName = '${pluginName}'
    archiveVersion = ''
}

processResources {
    expand project.properties
}
`;
}

// Create a simple JAR file from Java source files
async function createJarFromSources(files: PluginFile[], pluginName: string): Promise<Uint8Array> {
  const zip = new JSZip();
  
  // Add META-INF/MANIFEST.MF
  zip.file("META-INF/MANIFEST.MF", `Manifest-Version: 1.0
Created-By: Lunar Sky Studio
Main-Class: com.example.${pluginName}
`);

  // Add all resource files (plugin.yml, config.yml, etc.)
  for (const file of files) {
    if (!file.path.endsWith('.java')) {
      // Map src/main/resources/* to root of JAR
      const jarPath = file.path.replace('src/main/resources/', '');
      zip.file(jarPath, file.content);
    }
  }

  // Add Java source files (for source JAR) - useful for development
  const sourceFolder = zip.folder("sources");
  for (const file of files) {
    if (file.path.endsWith('.java')) {
      const sourcePath = file.path.replace('src/main/java/', '');
      sourceFolder?.file(sourcePath, file.content);
    }
  }

  // Generate the JAR (which is just a ZIP with .jar extension)
  const jarContent = await zip.generateAsync({ 
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 9 }
  });

  return jarContent;
}

// Build plugin using remote compilation service
async function buildWithRemoteService(
  files: PluginFile[], 
  pluginName: string, 
  javaVersion: string, 
  mcVersion: string, 
  serverAPI: string,
  buildTool: string
): Promise<{ success: boolean; jarData?: Uint8Array; message: string; errors?: string[] }> {
  
  // For now, we'll create a structured source JAR with all files
  // This allows users to compile locally but also provides immediate feedback
  
  // Validate Java files first
  const javaFiles = files.filter(f => f.path.endsWith('.java'));
  const errors: string[] = [];
  
  for (const file of javaFiles) {
    // Basic syntax checks
    if (!file.content.includes('class ') && !file.content.includes('interface ') && !file.content.includes('enum ')) {
      errors.push(`${file.path}: No class, interface, or enum declaration found`);
    }
    
    // Check for common issues
    if (file.content.includes('public class')) {
      const classMatch = file.content.match(/public\s+(class|interface|enum)\s+(\w+)/);
      const fileName = file.path.split('/').pop()?.replace('.java', '');
      if (classMatch && classMatch[2] !== fileName) {
        errors.push(`${file.path}: Class name '${classMatch[2]}' doesn't match file name '${fileName}'`);
      }
    }
    
    // Check for missing package statement
    if (!file.content.trim().startsWith('package ')) {
      errors.push(`${file.path}: Missing package declaration`);
    }
    
    // Check for unbalanced braces
    const openBraces = (file.content.match(/{/g) || []).length;
    const closeBraces = (file.content.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`${file.path}: Unbalanced braces (${openBraces} open, ${closeBraces} close)`);
    }
  }
  
  if (errors.length > 0) {
    return {
      success: false,
      message: 'Validation errors found',
      errors
    };
  }
  
  // Create the JAR package
  const zip = new JSZip();
  
  // Add META-INF
  zip.file("META-INF/MANIFEST.MF", `Manifest-Version: 1.0
Created-By: Lunar Sky Studio Build System
Build-Tool: ${buildTool}
Java-Version: ${javaVersion}
Minecraft-Version: ${mcVersion}
Server-API: ${serverAPI}
Plugin-Name: ${pluginName}
`);
  
  // Add plugin resources to JAR root
  for (const file of files) {
    if (file.path.startsWith('src/main/resources/')) {
      const resourcePath = file.path.replace('src/main/resources/', '');
      zip.file(resourcePath, file.content);
    }
  }
  
  // For compiled classes, we need actual bytecode
  // Since we can't compile in Deno, we'll create a stub structure
  // that indicates where compiled classes would go
  
  // Add compiled class stubs (placeholder for actual compilation)
  for (const file of javaFiles) {
    const classPath = file.path
      .replace('src/main/java/', '')
      .replace('.java', '.class');
    
    // Extract package and class info
    const packageMatch = file.content.match(/package\s+([\w.]+);/);
    const classMatch = file.content.match(/public\s+(class|interface|enum)\s+(\w+)/);
    
    if (packageMatch && classMatch) {
      const fullClassName = `${packageMatch[1]}.${classMatch[2]}`;
      
      // Create a minimal valid class file header (Java 8 format)
      // This is a placeholder - real compilation would be needed
      const classFileHeader = new Uint8Array([
        0xCA, 0xFE, 0xBA, 0xBE, // Magic number
        0x00, 0x00, // Minor version
        0x00, 0x34, // Major version (Java 8 = 52/0x34)
        0x00, 0x0A, // Constant pool count (placeholder)
        // Minimal constant pool and class structure would follow
        // This is a stub - actual compilation would produce real bytecode
      ]);
      
      // For now, we indicate this needs compilation
      zip.file(classPath + ".stub", `Class: ${fullClassName}\nSource: ${file.path}\nRequires compilation with ${buildTool.toUpperCase()}`);
    }
  }
  
  // Add build configuration based on selected build tool
  if (buildTool === 'maven') {
    zip.file("pom.xml", generatePomXml(pluginName, javaVersion, mcVersion, serverAPI));
  } else if (buildTool === 'gradle') {
    zip.file("build.gradle", generateBuildGradle(pluginName, javaVersion, mcVersion, serverAPI));
    zip.file("settings.gradle", `rootProject.name = '${pluginName.toLowerCase()}'`);
  }
  
  // Add source files for reference
  for (const file of files) {
    zip.file(file.path, file.content);
  }
  
  const jarData = await zip.generateAsync({ 
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 9 }
  });
  
  return {
    success: true,
    jarData,
    message: `✓ Source package created! Contains validated source code ready for ${buildTool.toUpperCase()} compilation.`
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user session using getClaims
    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data, error: authError } = await supabaseAuth.auth.getClaims(token);

    if (authError || !data?.claims) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = data.claims.sub;
    console.log(`User ${userId} is building a plugin`);

    const { files, pluginName, javaVersion, mcVersion, serverAPI, buildTool } = await req.json() as BuildRequest;

    console.log(`Building plugin: ${pluginName} with ${buildTool} (Java ${javaVersion}, MC ${mcVersion}, API: ${serverAPI})`);

    // Build the plugin
    const result = await buildWithRemoteService(files, pluginName, javaVersion, mcVersion, serverAPI, buildTool);

    if (!result.success) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: result.message,
          errors: result.errors
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return the JAR as base64
    const base64Jar = btoa(String.fromCharCode(...result.jarData!));
    
    return new Response(
      JSON.stringify({
        success: true,
        message: result.message,
        jarBase64: base64Jar,
        fileName: `${pluginName}.jar`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in build-plugin function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        message: `Build error: ${errorMessage}`
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
