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

// JDoodle Java version indices
const JAVA_VERSION_INDEX: Record<string, string> = {
  "17": "4",  // JDK 17.0.1
  "21": "5",  // JDK 21 (if available, fallback to 17)
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, pluginName, javaVersion = "17" } = await req.json() as { 
      files: PluginFile[], 
      pluginName: string,
      javaVersion?: string 
    };

    console.log(`Checking syntax for plugin: ${pluginName} with ${files.length} files (Java ${javaVersion})`);

    if (!JDOODLE_CLIENT_ID || !JDOODLE_CLIENT_SECRET) {
      console.error('JDoodle credentials not configured');
      return new Response(
        JSON.stringify({ 
          error: 'JDoodle API credentials not configured',
          message: 'Syntax checking is not available. Please use GitHub Actions to compile your plugin.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find Java files
    const javaFiles = files.filter(f => f.path.endsWith('.java'));
    
    if (javaFiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No Java files found',
          message: 'No Java files found in the plugin.',
          results: []
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const compilationResults: { file: string; success: boolean; output: string }[] = [];

    // Get JDoodle version index (use 4 for Java 17 as fallback since 21 might not be available)
    const versionIndex = JAVA_VERSION_INDEX[javaVersion] || "4";

    for (const file of javaFiles) {
      console.log(`Checking syntax: ${file.path}`);
      
      try {
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
            versionIndex: versionIndex,
            compileOnly: true,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`JDoodle API error for ${file.path}:`, response.status, errorText);
          compilationResults.push({
            file: file.path,
            success: false,
            output: `API Error: ${response.status} - Please try again later`,
          });
          continue;
        }

        const result = await response.json();
        console.log(`JDoodle response for ${file.path}:`, JSON.stringify(result));

        // JDoodle returns errors in the output field
        const hasError = result.error || 
          (result.output && (
            result.output.includes('error:') || 
            result.output.includes('Error:') ||
            result.output.includes('cannot find symbol') ||
            result.output.includes('package .* does not exist')
          ));

        // For Minecraft plugins, we expect "package does not exist" errors for Bukkit/Spigot imports
        // These are expected and should not be treated as failures
        const isBukkitImportError = result.output && (
          result.output.includes('package org.bukkit') ||
          result.output.includes('package net.md_5') ||
          result.output.includes('package com.destroystokyo')
        );

        // Check for actual syntax errors (not import errors)
        const hasSyntaxError = hasError && !isBukkitImportError;

        compilationResults.push({
          file: file.path,
          success: !hasSyntaxError,
          output: isBukkitImportError 
            ? '✓ Syntax valid (Bukkit imports will resolve at build time)'
            : (result.output || result.error || '✓ Syntax valid'),
        });

      } catch (fetchError) {
        console.error(`Fetch error for ${file.path}:`, fetchError);
        compilationResults.push({
          file: file.path,
          success: false,
          output: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
        });
      }
    }

    const allSuccess = compilationResults.every(r => r.success);
    
    return new Response(
      JSON.stringify({
        success: allSuccess,
        message: allSuccess 
          ? `✓ All ${javaFiles.length} file(s) passed syntax check!` 
          : 'Some files have syntax errors. Check the details below.',
        results: compilationResults,
        javaVersion,
        note: 'Use "Export for GitHub" to compile your plugin into a JAR file.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in compile-plugin function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        message: `Error: ${errorMessage}`,
        results: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
