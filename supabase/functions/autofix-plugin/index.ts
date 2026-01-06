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

    // Process each error
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
