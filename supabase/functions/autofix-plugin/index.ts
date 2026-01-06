import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

interface AutofixRequest {
  files: PluginFile[];
  errors: string[];
  pluginName: string;
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
    console.log(`User ${userId} is requesting autofix`);

    const { files, errors, pluginName } = await req.json() as AutofixRequest;

    console.log(`Autofixing ${pluginName} with ${errors.length} errors`);
    console.log(`Errors received:`, errors);

    // Track fixes per file
    const fileFixesMap: Map<string, { content: string; changes: string[] }> = new Map();
    const suggestions: string[] = [];

    // Helper to find file by path or partial match
    const findFile = (errorPath: string): PluginFile | undefined => {
      // Direct match
      let file = files.find(f => f.path === errorPath);
      if (file) return file;

      // Match by filename
      const fileName = errorPath.split('/').pop() || errorPath;
      file = files.find(f => f.path.endsWith(fileName) || f.path.includes(fileName.replace('.java', '')));
      if (file) return file;

      // Try matching class name from error
      const classMatch = errorPath.match(/(\w+)\.java/);
      if (classMatch) {
        file = files.find(f => f.path.includes(classMatch[1]));
      }

      return file;
    };

    // Get or init file fix tracking
    const getFileFix = (file: PluginFile) => {
      if (!fileFixesMap.has(file.path)) {
        fileFixesMap.set(file.path, { content: file.content, changes: [] });
      }
      return fileFixesMap.get(file.path)!;
    };

    // Helper: Add missing import
    const addImport = (content: string, importStatement: string): string => {
      if (content.includes(importStatement)) return content;
      
      // Find position after package declaration
      const packageMatch = content.match(/^(package\s+[\w.]+;\s*\n)/m);
      if (packageMatch) {
        const insertPos = packageMatch.index! + packageMatch[0].length;
        return content.slice(0, insertPos) + importStatement + '\n' + content.slice(insertPos);
      }
      
      // Add at the beginning if no package
      return importStatement + '\n' + content;
    };

    // Common import mappings for Bukkit/Spigot
    const commonImports: Record<string, string> = {
      'JavaPlugin': 'import org.bukkit.plugin.java.JavaPlugin;',
      'Bukkit': 'import org.bukkit.Bukkit;',
      'Player': 'import org.bukkit.entity.Player;',
      'Entity': 'import org.bukkit.entity.Entity;',
      'Location': 'import org.bukkit.Location;',
      'World': 'import org.bukkit.World;',
      'Material': 'import org.bukkit.Material;',
      'ItemStack': 'import org.bukkit.inventory.ItemStack;',
      'Inventory': 'import org.bukkit.inventory.Inventory;',
      'Event': 'import org.bukkit.event.Event;',
      'Listener': 'import org.bukkit.event.Listener;',
      'EventHandler': 'import org.bukkit.event.EventHandler;',
      'EventPriority': 'import org.bukkit.event.EventPriority;',
      'PlayerJoinEvent': 'import org.bukkit.event.player.PlayerJoinEvent;',
      'PlayerQuitEvent': 'import org.bukkit.event.player.PlayerQuitEvent;',
      'PlayerMoveEvent': 'import org.bukkit.event.player.PlayerMoveEvent;',
      'PlayerInteractEvent': 'import org.bukkit.event.player.PlayerInteractEvent;',
      'PlayerDeathEvent': 'import org.bukkit.event.entity.PlayerDeathEvent;',
      'EntityDamageEvent': 'import org.bukkit.event.entity.EntityDamageEvent;',
      'EntityDamageByEntityEvent': 'import org.bukkit.event.entity.EntityDamageByEntityEvent;',
      'BlockBreakEvent': 'import org.bukkit.event.block.BlockBreakEvent;',
      'BlockPlaceEvent': 'import org.bukkit.event.block.BlockPlaceEvent;',
      'Command': 'import org.bukkit.command.Command;',
      'CommandSender': 'import org.bukkit.command.CommandSender;',
      'CommandExecutor': 'import org.bukkit.command.CommandExecutor;',
      'TabCompleter': 'import org.bukkit.command.TabCompleter;',
      'ConsoleCommandSender': 'import org.bukkit.command.ConsoleCommandSender;',
      'ChatColor': 'import org.bukkit.ChatColor;',
      'Sound': 'import org.bukkit.Sound;',
      'Particle': 'import org.bukkit.Particle;',
      'PotionEffect': 'import org.bukkit.potion.PotionEffect;',
      'PotionEffectType': 'import org.bukkit.potion.PotionEffectType;',
      'BukkitRunnable': 'import org.bukkit.scheduler.BukkitRunnable;',
      'BukkitScheduler': 'import org.bukkit.scheduler.BukkitScheduler;',
      'BukkitTask': 'import org.bukkit.scheduler.BukkitTask;',
      'FileConfiguration': 'import org.bukkit.configuration.file.FileConfiguration;',
      'YamlConfiguration': 'import org.bukkit.configuration.file.YamlConfiguration;',
      'ConfigurationSection': 'import org.bukkit.configuration.ConfigurationSection;',
      'Block': 'import org.bukkit.block.Block;',
      'BlockFace': 'import org.bukkit.block.BlockFace;',
      'GameMode': 'import org.bukkit.GameMode;',
      'PluginManager': 'import org.bukkit.plugin.PluginManager;',
      'Enchantment': 'import org.bukkit.enchantments.Enchantment;',
      'ItemMeta': 'import org.bukkit.inventory.meta.ItemMeta;',
      'Vector': 'import org.bukkit.util.Vector;',
      // Java standard library
      'ArrayList': 'import java.util.ArrayList;',
      'List': 'import java.util.List;',
      'HashMap': 'import java.util.HashMap;',
      'Map': 'import java.util.Map;',
      'HashSet': 'import java.util.HashSet;',
      'Set': 'import java.util.Set;',
      'UUID': 'import java.util.UUID;',
      'Random': 'import java.util.Random;',
      'Arrays': 'import java.util.Arrays;',
      'Collections': 'import java.util.Collections;',
      'File': 'import java.io.File;',
      'IOException': 'import java.io.IOException;',
      'Collection': 'import java.util.Collection;',
      'Iterator': 'import java.util.Iterator;',
      'Objects': 'import java.util.Objects;',
      'Optional': 'import java.util.Optional;',
      'Stream': 'import java.util.stream.Stream;',
      'Collectors': 'import java.util.stream.Collectors;',
    };

    // === FIX POM.XML ISSUES FIRST ===
    const pomFile = files.find(f => f.path.endsWith('pom.xml'));
    if (pomFile) {
      const pomFix = getFileFix(pomFile);
      let pomContent = pomFix.content;
      
      // Remove markdown code block wrappers if present
      if (pomContent.includes('```xml') || pomContent.includes('```')) {
        pomContent = pomContent.replace(/```xml\s*\n?/gi, '').replace(/```\s*$/gm, '').trim();
        pomFix.changes.push('Removed markdown code block wrappers from pom.xml');
      }
      
      // Ensure proper XML declaration at the start
      if (!pomContent.trim().startsWith('<?xml')) {
        pomContent = `<?xml version="1.0" encoding="UTF-8"?>\n${pomContent}`;
        pomFix.changes.push('Added XML declaration to pom.xml');
      }
      
      // Check for missing <project> root element
      if (!pomContent.includes('<project')) {
        pomContent = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>${pluginName.replace(/\s+/g, '')}</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>${pluginName}</name>
</project>`;
        pomFix.changes.push('Created complete pom.xml structure');
      }
      
      // Add missing namespaces to <project>
      if (pomContent.includes('<project>') && !pomContent.includes('xmlns=')) {
        pomContent = pomContent.replace(
          '<project>',
          `<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">`
        );
        pomFix.changes.push('Added Maven namespaces to project element');
      }
      
      // Ensure modelVersion is present
      if (!pomContent.includes('<modelVersion>')) {
        const projectMatch = pomContent.match(/<project[^>]*>/);
        if (projectMatch) {
          const insertPos = pomContent.indexOf(projectMatch[0]) + projectMatch[0].length;
          pomContent = pomContent.slice(0, insertPos) + '\n    <modelVersion>4.0.0</modelVersion>' + pomContent.slice(insertPos);
          pomFix.changes.push('Added modelVersion 4.0.0');
        }
      }
      
      // Ensure groupId is present
      if (!pomContent.includes('<groupId>')) {
        const versionPos = pomContent.indexOf('<modelVersion>');
        if (versionPos !== -1) {
          const endModelVersion = pomContent.indexOf('</modelVersion>', versionPos);
          if (endModelVersion !== -1) {
            pomContent = pomContent.slice(0, endModelVersion + '</modelVersion>'.length) + 
              '\n    <groupId>com.example</groupId>' + pomContent.slice(endModelVersion + '</modelVersion>'.length);
            pomFix.changes.push('Added default groupId: com.example');
          }
        }
      }
      
      // Ensure artifactId is present
      if (!pomContent.includes('<artifactId>')) {
        const groupIdEnd = pomContent.indexOf('</groupId>');
        if (groupIdEnd !== -1) {
          pomContent = pomContent.slice(0, groupIdEnd + '</groupId>'.length) + 
            `\n    <artifactId>${pluginName.replace(/\s+/g, '')}</artifactId>` + pomContent.slice(groupIdEnd + '</groupId>'.length);
          pomFix.changes.push(`Added artifactId: ${pluginName.replace(/\s+/g, '')}`);
        }
      }
      
      // Ensure version is present
      if (!pomContent.includes('<version>') || (pomContent.match(/<version>/g) || []).length < 1) {
        const artifactIdEnd = pomContent.indexOf('</artifactId>');
        if (artifactIdEnd !== -1) {
          const afterArtifact = pomContent.indexOf('\n', artifactIdEnd);
          if (afterArtifact !== -1 && !pomContent.slice(artifactIdEnd, artifactIdEnd + 100).includes('<version>')) {
            pomContent = pomContent.slice(0, afterArtifact) + '\n    <version>1.0.0</version>' + pomContent.slice(afterArtifact);
            pomFix.changes.push('Added version: 1.0.0');
          }
        }
      }
      
      // Ensure packaging is present
      if (!pomContent.includes('<packaging>')) {
        const versionEnd = pomContent.match(/<version>[^<]+<\/version>/);
        if (versionEnd) {
          const versionEndPos = pomContent.indexOf(versionEnd[0]) + versionEnd[0].length;
          pomContent = pomContent.slice(0, versionEndPos) + '\n    <packaging>jar</packaging>' + pomContent.slice(versionEndPos);
          pomFix.changes.push('Added packaging: jar');
        }
      }
      
      // Check for Spigot repository
      if (!pomContent.includes('spigot-repo') && !pomContent.includes('spigotmc.org')) {
        const reposMatch = pomContent.match(/<repositories>/);
        if (reposMatch) {
          const reposPos = pomContent.indexOf('<repositories>') + '<repositories>'.length;
          pomContent = pomContent.slice(0, reposPos) + `
        <repository>
            <id>spigot-repo</id>
            <url>https://hub.spigotmc.org/nexus/content/repositories/snapshots/</url>
        </repository>` + pomContent.slice(reposPos);
          pomFix.changes.push('Added Spigot Maven repository');
        } else if (!pomContent.includes('<repositories>')) {
          // Add repositories section before </project>
          const projectEnd = pomContent.lastIndexOf('</project>');
          if (projectEnd !== -1) {
            pomContent = pomContent.slice(0, projectEnd) + `
    <repositories>
        <repository>
            <id>spigot-repo</id>
            <url>https://hub.spigotmc.org/nexus/content/repositories/snapshots/</url>
        </repository>
    </repositories>
` + pomContent.slice(projectEnd);
            pomFix.changes.push('Added repositories section with Spigot repository');
          }
        }
      }
      
      // Check for Spigot API dependency
      if (!pomContent.includes('spigot-api') && !pomContent.includes('bukkit')) {
        const depsMatch = pomContent.match(/<dependencies>/);
        if (depsMatch) {
          const depsPos = pomContent.indexOf('<dependencies>') + '<dependencies>'.length;
          pomContent = pomContent.slice(0, depsPos) + `
        <dependency>
            <groupId>org.spigotmc</groupId>
            <artifactId>spigot-api</artifactId>
            <version>1.20.1-R0.1-SNAPSHOT</version>
            <scope>provided</scope>
        </dependency>` + pomContent.slice(depsPos);
          pomFix.changes.push('Added Spigot API dependency');
        } else if (!pomContent.includes('<dependencies>')) {
          const projectEnd = pomContent.lastIndexOf('</project>');
          if (projectEnd !== -1) {
            pomContent = pomContent.slice(0, projectEnd) + `
    <dependencies>
        <dependency>
            <groupId>org.spigotmc</groupId>
            <artifactId>spigot-api</artifactId>
            <version>1.20.1-R0.1-SNAPSHOT</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>
` + pomContent.slice(projectEnd);
            pomFix.changes.push('Added dependencies section with Spigot API');
          }
        }
      }
      
      // Check for build plugins (maven-compiler-plugin and maven-shade-plugin)
      if (!pomContent.includes('maven-compiler-plugin')) {
        const buildMatch = pomContent.match(/<build>/);
        if (buildMatch) {
          if (!pomContent.includes('<plugins>')) {
            const buildPos = pomContent.indexOf('<build>') + '<build>'.length;
            pomContent = pomContent.slice(0, buildPos) + `
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.1</version>
                <configuration>
                    <source>1.8</source>
                    <target>1.8</target>
                </configuration>
            </plugin>
        </plugins>` + pomContent.slice(buildPos);
            pomFix.changes.push('Added maven-compiler-plugin');
          }
        } else if (!pomContent.includes('<build>')) {
          const projectEnd = pomContent.lastIndexOf('</project>');
          if (projectEnd !== -1) {
            pomContent = pomContent.slice(0, projectEnd) + `
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.1</version>
                <configuration>
                    <source>1.8</source>
                    <target>1.8</target>
                </configuration>
            </plugin>
        </plugins>
    </build>
` + pomContent.slice(projectEnd);
            pomFix.changes.push('Added build section with maven-compiler-plugin');
          }
        }
      }
      
      // Fix common XML syntax issues
      // Fix unclosed tags (simple cases)
      const unclosedTags = pomContent.match(/<(\w+)>[^<]*$/gm);
      if (unclosedTags) {
        for (const tag of unclosedTags) {
          const tagName = tag.match(/<(\w+)>/)?.[1];
          if (tagName && !pomContent.includes(`</${tagName}>`)) {
            pomContent = pomContent + `</${tagName}>`;
            pomFix.changes.push(`Closed unclosed <${tagName}> tag`);
          }
        }
      }
      
      // Ensure </project> closing tag exists
      if (!pomContent.includes('</project>')) {
        pomContent = pomContent.trimEnd() + '\n</project>';
        pomFix.changes.push('Added missing </project> closing tag');
      }
      
      pomFix.content = pomContent;
    }

    // === FIX PLUGIN.YML ISSUES ===
    const pluginYml = files.find(f => f.path.includes('plugin.yml'));
    if (pluginYml) {
      const ymlFix = getFileFix(pluginYml);
      let ymlContent = ymlFix.content;
      
      // Ensure name is present
      if (!ymlContent.includes('name:')) {
        ymlContent = `name: ${pluginName}\n${ymlContent}`;
        ymlFix.changes.push('Added plugin name to plugin.yml');
      }
      
      // Ensure version is present
      if (!ymlContent.includes('version:')) {
        const nameLineEnd = ymlContent.indexOf('\n');
        ymlContent = ymlContent.slice(0, nameLineEnd + 1) + 'version: 1.0.0\n' + ymlContent.slice(nameLineEnd + 1);
        ymlFix.changes.push('Added version to plugin.yml');
      }
      
      // Ensure main class is present
      if (!ymlContent.includes('main:')) {
        // Find the main class from Java files
        let mainClass = 'com.example.' + pluginName.replace(/\s+/g, '');
        for (const f of files) {
          if (f.path.endsWith('.java') && f.content.includes('extends JavaPlugin')) {
            const packageMatch = f.content.match(/package\s+([\w.]+);/);
            const classMatch = f.content.match(/public\s+class\s+(\w+)\s+extends\s+JavaPlugin/);
            if (packageMatch && classMatch) {
              mainClass = `${packageMatch[1]}.${classMatch[1]}`;
              break;
            }
          }
        }
        
        const versionLineEnd = ymlContent.indexOf('\n', ymlContent.indexOf('version:'));
        if (versionLineEnd !== -1) {
          ymlContent = ymlContent.slice(0, versionLineEnd + 1) + `main: ${mainClass}\n` + ymlContent.slice(versionLineEnd + 1);
          ymlFix.changes.push(`Added main class: ${mainClass}`);
        }
      }
      
      // Ensure api-version is present for modern Spigot
      if (!ymlContent.includes('api-version:')) {
        ymlContent = ymlContent.trimEnd() + '\napi-version: 1.20\n';
        ymlFix.changes.push('Added api-version: 1.20');
      }
      
      ymlFix.content = ymlContent;
    }

    // Process each error for Java files
    for (const error of errors) {
      console.log(`Processing error: ${error}`);

      // Extract file path from error - handle various formats
      let filePath = '';
      
      // Format: "filepath.java:line:col: error: message"
      const colonMatch = error.match(/^([^\s:]+\.java):\d+/);
      if (colonMatch) filePath = colonMatch[1];
      
      // Format: "Error in filepath.java"
      const inMatch = error.match(/(?:in|In|IN)\s+([^\s:]+\.java)/);
      if (!filePath && inMatch) filePath = inMatch[1];
      
      // Format: "filepath.java - error"
      const dashMatch = error.match(/^([^\s-]+\.java)\s*-/);
      if (!filePath && dashMatch) filePath = dashMatch[1];
      
      // Format: just look for any .java file reference
      const javaMatch = error.match(/(\w+\.java)/);
      if (!filePath && javaMatch) filePath = javaMatch[1];

      console.log(`Extracted file path: ${filePath}`);
      
      const file = filePath ? findFile(filePath) : null;
      
      // === ERROR: cannot find symbol ===
      if (error.includes('cannot find symbol')) {
        // Extract the symbol name
        const symbolMatch = error.match(/symbol:\s*(?:class|variable|method)\s+(\w+)/i) ||
                           error.match(/cannot find symbol[^:]*:\s*(\w+)/i) ||
                           error.match(/symbol\s+(\w+)/i);
        
        if (symbolMatch) {
          const symbol = symbolMatch[1];
          console.log(`Missing symbol: ${symbol}`);
          
          // Check if it's a known import
          if (commonImports[symbol]) {
            if (file) {
              const fix = getFileFix(file);
              const newContent = addImport(fix.content, commonImports[symbol]);
              if (newContent !== fix.content) {
                fix.content = newContent;
                fix.changes.push(`Added import: ${commonImports[symbol]}`);
              }
            } else {
              // Add to all Java files as suggestion
              for (const f of files) {
                if (f.path.endsWith('.java') && f.content.includes(symbol)) {
                  const fix = getFileFix(f);
                  const newContent = addImport(fix.content, commonImports[symbol]);
                  if (newContent !== fix.content) {
                    fix.content = newContent;
                    fix.changes.push(`Added import: ${commonImports[symbol]}`);
                  }
                }
              }
            }
          } else {
            suggestions.push(`Missing symbol '${symbol}' - check if class exists or add required import`);
          }
        }
      }

      // === ERROR: Missing package declaration ===
      if (error.toLowerCase().includes('missing package') || 
          error.includes('should be declared in a package')) {
        if (file) {
          const fix = getFileFix(file);
          if (!fix.content.trim().startsWith('package ')) {
            const javaPath = file.path.replace('src/main/java/', '').replace('.java', '');
            const packagePath = javaPath.split('/').slice(0, -1).join('.');
            if (packagePath) {
              fix.content = `package ${packagePath};\n\n${fix.content}`;
              fix.changes.push(`Added package declaration: ${packagePath}`);
            }
          }
        }
      }

      // === ERROR: Class name doesn't match file name ===
      if (error.includes("doesn't match") || error.includes('should be declared in a file')) {
        const classMatch = error.match(/(?:class|Class)\s+'?(\w+)'?\s+(?:doesn't match|should be)/);
        const fileMatch = error.match(/file\s+(?:name\s+)?'?(\w+)'?/);
        
        if (file && classMatch) {
          const wrongName = classMatch[1];
          const correctName = file.path.split('/').pop()?.replace('.java', '') || '';
          
          if (wrongName && correctName && wrongName !== correctName) {
            const fix = getFileFix(file);
            fix.content = fix.content.replace(
              new RegExp(`(public\\s+(?:abstract\\s+)?(?:final\\s+)?(?:class|interface|enum)\\s+)${wrongName}\\b`, 'g'),
              `$1${correctName}`
            );
            fix.changes.push(`Renamed class from '${wrongName}' to '${correctName}'`);
          }
        }
      }

      // === ERROR: Unbalanced braces ===
      if (error.toLowerCase().includes('unbalanced') || 
          error.includes('reached end of file while parsing') ||
          error.includes("'}' expected") ||
          error.includes("'{' expected")) {
        if (file) {
          const fix = getFileFix(file);
          const openBraces = (fix.content.match(/{/g) || []).length;
          const closeBraces = (fix.content.match(/}/g) || []).length;
          
          if (openBraces > closeBraces) {
            const missing = openBraces - closeBraces;
            fix.content = fix.content.trimEnd() + '\n' + '}'.repeat(missing) + '\n';
            fix.changes.push(`Added ${missing} missing closing brace(s)`);
          } else if (closeBraces > openBraces) {
            const extra = closeBraces - openBraces;
            for (let i = 0; i < extra; i++) {
              const lastBrace = fix.content.lastIndexOf('}');
              if (lastBrace !== -1) {
                fix.content = fix.content.substring(0, lastBrace) + fix.content.substring(lastBrace + 1);
              }
            }
            fix.changes.push(`Removed ${extra} extra closing brace(s)`);
          }
        }
      }

      // === ERROR: No class/interface/enum found ===
      if (error.includes('No class') || error.includes('class, interface, or enum expected')) {
        if (file) {
          const fix = getFileFix(file);
          if (!fix.content.includes('class ') && !fix.content.includes('interface ') && !fix.content.includes('enum ')) {
            const fileName = file.path.split('/').pop()?.replace('.java', '') || 'MyClass';
            const packageMatch = fix.content.match(/package\s+([\w.]+);/);
            const imports = fix.content.match(/import\s+[\w.*]+;\s*/g) || [];
            const packageLine = packageMatch ? `package ${packageMatch[1]};\n\n` : '';
            const importsBlock = imports.join('');
            
            fix.content = `${packageLine}${importsBlock}
public class ${fileName} extends JavaPlugin {
    @Override
    public void onEnable() {
        getLogger().info("${fileName} enabled!");
    }
    
    @Override
    public void onDisable() {
        getLogger().info("${fileName} disabled!");
    }
}
`;
            fix.changes.push(`Created basic plugin class structure for ${fileName}`);
          }
        }
      }

      // === ERROR: Missing semicolon ===
      if (error.includes("';' expected") || error.includes('missing semicolon')) {
        const lineMatch = error.match(/:(\d+):/);
        if (file && lineMatch) {
          const lineNum = parseInt(lineMatch[1]) - 1;
          const fix = getFileFix(file);
          const lines = fix.content.split('\n');
          
          if (lineNum >= 0 && lineNum < lines.length) {
            const line = lines[lineNum];
            const trimmed = line.trim();
            // Only add semicolon if line doesn't end with {, }, ;, or is not a control statement
            if (!trimmed.endsWith('{') && !trimmed.endsWith('}') && !trimmed.endsWith(';') &&
                !trimmed.endsWith(',') && !trimmed.startsWith('//') && !trimmed.startsWith('/*') &&
                !trimmed.startsWith('*') && !trimmed.startsWith('@') &&
                !/^(if|else|for|while|try|catch|finally|switch|case|default)\b/.test(trimmed)) {
              lines[lineNum] = line.trimEnd() + ';';
              fix.content = lines.join('\n');
              fix.changes.push(`Added missing semicolon at line ${lineNum + 1}`);
            }
          }
        }
      }

      // === ERROR: Incompatible types ===
      if (error.includes('incompatible types')) {
        suggestions.push('Type mismatch error - verify variable types match expected types. Check return types and method parameters.');
      }

      // === ERROR: Method does not override ===
      if (error.includes('method does not override')) {
        suggestions.push('Override method signature mismatch - ensure @Override methods match parent class signatures exactly (check parameter types and return type).');
      }

      // === ERROR: Illegal start of expression ===
      if (error.includes('illegal start of expression')) {
        suggestions.push('Syntax error - check for misplaced keywords, missing brackets, or invalid statements.');
      }

      // === ERROR: Unreported exception ===
      if (error.includes('unreported exception') || error.includes('must be caught')) {
        const exceptionMatch = error.match(/exception\s+(\w+)/i);
        if (exceptionMatch) {
          suggestions.push(`Add try-catch block or 'throws ${exceptionMatch[1]}' to method signature`);
        }
      }

      // === ERROR: Already defined ===
      if (error.includes('already defined') || error.includes('duplicate')) {
        suggestions.push('Variable or method with same name already exists - rename one of them or remove the duplicate.');
      }

      // === ERROR: Non-static from static context ===
      if (error.includes('non-static') && error.includes('static context')) {
        suggestions.push('Cannot access non-static member from static context - create an instance or make the member static.');
      }
    }

    // Apply fixes to original files array
    const fixedFiles = files.map(file => {
      const fix = fileFixesMap.get(file.path);
      if (fix && fix.changes.length > 0) {
        return { path: file.path, content: fix.content };
      }
      return file;
    });

    const allChanges = Array.from(fileFixesMap.values()).flatMap(f => f.changes);
    const uniqueSuggestions = [...new Set(suggestions)];
    
    console.log(`Applied ${allChanges.length} fixes, ${uniqueSuggestions.length} suggestions`);
    
    return new Response(
      JSON.stringify({
        success: true,
        fixedFiles,
        changes: allChanges,
        suggestions: uniqueSuggestions,
        message: allChanges.length > 0 
          ? `Applied ${allChanges.length} fix(es). Attempting rebuild...`
          : uniqueSuggestions.length > 0
            ? 'No automatic fixes available, but here are some suggestions.'
            : 'No automatic fixes available. Please review errors manually.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in autofix-plugin function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        message: `Autofix error: ${errorMessage}`
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
