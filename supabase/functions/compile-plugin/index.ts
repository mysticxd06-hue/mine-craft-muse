import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JDOODLE_CLIENT_ID = Deno.env.get('JDOODLE_CLIENT_ID');
const JDOODLE_CLIENT_SECRET = Deno.env.get('JDOODLE_CLIENT_SECRET');

interface PluginFile {
  path: string;
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, pluginName } = await req.json() as { files: PluginFile[], pluginName: string };

    console.log(`Compiling plugin: ${pluginName} with ${files.length} files`);

    if (!JDOODLE_CLIENT_ID || !JDOODLE_CLIENT_SECRET) {
      console.error('JDoodle credentials not configured');
      return new Response(
        JSON.stringify({ error: 'JDoodle API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the main Java class file
    const mainFile = files.find(f => f.path.endsWith('.java') && f.content.includes('extends JavaPlugin'));
    if (!mainFile) {
      return new Response(
        JSON.stringify({ error: 'No main plugin class found (class extending JavaPlugin)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For JDoodle, we need to compile Java code
    // JDoodle has limitations - it can only compile single files or simple projects
    // For Minecraft plugins, we'll compile each Java file and provide feedback
    
    const javaFiles = files.filter(f => f.path.endsWith('.java'));
    const compilationResults: { file: string; success: boolean; output: string }[] = [];

    for (const file of javaFiles) {
      console.log(`Compiling: ${file.path}`);
      
      // Prepare the code for JDoodle
      // We need to add stub imports for Bukkit/Spigot API since JDoodle doesn't have them
      const stubCode = `
// Spigot API Stubs for compilation verification
package org.bukkit.plugin.java;
class JavaPlugin {
  public void onEnable() {}
  public void onDisable() {}
  public java.util.logging.Logger getLogger() { return null; }
  public void saveDefaultConfig() {}
  public org.bukkit.configuration.file.FileConfiguration getConfig() { return null; }
  public org.bukkit.Server getServer() { return null; }
}

package org.bukkit;
class Bukkit {
  public static Server getServer() { return null; }
}
interface Server {
  org.bukkit.scheduler.BukkitScheduler getScheduler();
}
class ChatColor {
  public static final String RED = "";
  public static final String GREEN = "";
  public static final String GOLD = "";
  public static final String YELLOW = "";
  public static final String AQUA = "";
  public static final String WHITE = "";
  public static final String GRAY = "";
  public static final String RESET = "";
  public static String translateAlternateColorCodes(char c, String s) { return s; }
}

package org.bukkit.command;
interface CommandSender { void sendMessage(String msg); }
interface CommandExecutor { boolean onCommand(CommandSender s, Command c, String l, String[] args); }
class Command { public String getName() { return ""; } }

package org.bukkit.entity;
interface Player extends org.bukkit.command.CommandSender { 
  String getName();
  java.util.UUID getUniqueId();
}

package org.bukkit.event;
interface Listener {}
@interface EventHandler {}
class Event {}

package org.bukkit.event.player;
class PlayerJoinEvent extends org.bukkit.event.Event {
  public org.bukkit.entity.Player getPlayer() { return null; }
  public String getJoinMessage() { return ""; }
  public void setJoinMessage(String msg) {}
}
class PlayerQuitEvent extends org.bukkit.event.Event {
  public org.bukkit.entity.Player getPlayer() { return null; }
}

package org.bukkit.configuration.file;
class FileConfiguration {
  public String getString(String path) { return ""; }
  public int getInt(String path) { return 0; }
  public boolean getBoolean(String path) { return false; }
  public void set(String path, Object value) {}
}

package org.bukkit.scheduler;
interface BukkitScheduler {
  void runTaskLater(org.bukkit.plugin.java.JavaPlugin plugin, Runnable task, long delay);
}

// End of stubs

`;

      // JDoodle API call for syntax checking
      const response = await fetch('https://api.jdoodle.com/v1/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: JDOODLE_CLIENT_ID,
          clientSecret: JDOODLE_CLIENT_SECRET,
          script: file.content,
          language: 'java',
          versionIndex: '4', // Java 17
          compileOnly: true,
        }),
      });

      const result = await response.json();
      console.log(`JDoodle response for ${file.path}:`, JSON.stringify(result));

      compilationResults.push({
        file: file.path,
        success: !result.error && (!result.output || !result.output.includes('error')),
        output: result.output || result.error || 'Compilation successful',
      });
    }

    const allSuccess = compilationResults.every(r => r.success);
    
    // Return compilation results
    return new Response(
      JSON.stringify({
        success: allSuccess,
        message: allSuccess 
          ? 'All files compiled successfully! Your plugin code is valid.' 
          : 'Some files have compilation errors. Please check the details.',
        results: compilationResults,
        note: 'JDoodle cannot produce a full Minecraft plugin JAR due to Spigot API dependencies. Use GitHub Actions for full JAR compilation.',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in compile-plugin function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
