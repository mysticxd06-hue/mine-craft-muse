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

    // Analyze errors and generate fixes
    const fixes: { path: string; content: string; changes: string[] }[] = [];
    const suggestions: string[] = [];

    for (const error of errors) {
      // Parse error to find file and issue
      const fileMatch = error.match(/^([^:]+):/);
      const filePath = fileMatch ? fileMatch[1].trim() : null;
      
      if (!filePath) continue;

      const file = files.find(f => f.path === filePath || f.path.endsWith(filePath.split('/').pop() || ''));
      if (!file) continue;

      let fixedContent = file.content;
      const changes: string[] = [];

      // Fix: Missing package declaration
      if (error.includes('Missing package declaration')) {
        const javaPath = file.path.replace('src/main/java/', '').replace('.java', '');
        const packagePath = javaPath.split('/').slice(0, -1).join('.');
        if (packagePath && !fixedContent.trim().startsWith('package ')) {
          fixedContent = `package ${packagePath};\n\n${fixedContent}`;
          changes.push(`Added package declaration: ${packagePath}`);
        }
      }

      // Fix: Class name doesn't match file name
      if (error.includes("doesn't match file name")) {
        const classNameMatch = error.match(/Class name '(\w+)' doesn't match file name '(\w+)'/);
        if (classNameMatch) {
          const [, wrongName, correctName] = classNameMatch;
          // Replace the class name with the correct one
          fixedContent = fixedContent.replace(
            new RegExp(`(public\\s+(class|interface|enum)\\s+)${wrongName}`, 'g'),
            `$1${correctName}`
          );
          changes.push(`Renamed class from '${wrongName}' to '${correctName}'`);
        }
      }

      // Fix: Unbalanced braces
      if (error.includes('Unbalanced braces')) {
        const openBraces = (fixedContent.match(/{/g) || []).length;
        const closeBraces = (fixedContent.match(/}/g) || []).length;
        
        if (openBraces > closeBraces) {
          // Add missing closing braces
          const missing = openBraces - closeBraces;
          fixedContent = fixedContent.trimEnd() + '\n' + '}'.repeat(missing) + '\n';
          changes.push(`Added ${missing} missing closing brace(s)`);
        } else if (closeBraces > openBraces) {
          // Remove extra closing braces from the end
          const extra = closeBraces - openBraces;
          for (let i = 0; i < extra; i++) {
            const lastBrace = fixedContent.lastIndexOf('}');
            if (lastBrace !== -1) {
              fixedContent = fixedContent.substring(0, lastBrace) + fixedContent.substring(lastBrace + 1);
            }
          }
          changes.push(`Removed ${extra} extra closing brace(s)`);
        }
      }

      // Fix: No class, interface, or enum declaration found
      if (error.includes('No class, interface, or enum declaration found')) {
        const fileName = file.path.split('/').pop()?.replace('.java', '') || 'MyClass';
        if (!fixedContent.includes('class ') && !fixedContent.includes('interface ') && !fixedContent.includes('enum ')) {
          // Extract package if exists
          const packageMatch = fixedContent.match(/package\s+([\w.]+);/);
          const imports = fixedContent.match(/import\s+[\w.]+;\s*/g) || [];
          const packageLine = packageMatch ? `package ${packageMatch[1]};\n\n` : '';
          const importsBlock = imports.join('');
          
          // Create a basic class structure
          fixedContent = `${packageLine}${importsBlock}
public class ${fileName} {
    // TODO: Implement your class
}
`;
          changes.push(`Created basic class structure for ${fileName}`);
        }
      }

      // Fix common syntax issues
      // Missing semicolons after statements (basic detection)
      const lines = fixedContent.split('\n');
      const fixedLines = lines.map((line, idx) => {
        const trimmed = line.trim();
        // Skip if empty, comment, or already has proper ending
        if (!trimmed || 
            trimmed.startsWith('//') || 
            trimmed.startsWith('/*') || 
            trimmed.startsWith('*') ||
            trimmed.endsWith('{') || 
            trimmed.endsWith('}') || 
            trimmed.endsWith(';') ||
            trimmed.endsWith(',') ||
            trimmed.startsWith('package ') ||
            trimmed.startsWith('import ') ||
            trimmed.startsWith('if') ||
            trimmed.startsWith('else') ||
            trimmed.startsWith('for') ||
            trimmed.startsWith('while') ||
            trimmed.startsWith('try') ||
            trimmed.startsWith('catch') ||
            trimmed.startsWith('finally') ||
            trimmed.startsWith('@') ||
            trimmed.startsWith('public ') ||
            trimmed.startsWith('private ') ||
            trimmed.startsWith('protected ') ||
            trimmed.startsWith('class ') ||
            trimmed.startsWith('interface ') ||
            trimmed.startsWith('enum ')) {
          return line;
        }
        return line;
      });
      fixedContent = fixedLines.join('\n');

      if (changes.length > 0) {
        // Check if we already have a fix for this file
        const existingFix = fixes.find(f => f.path === file.path);
        if (existingFix) {
          existingFix.content = fixedContent;
          existingFix.changes.push(...changes);
        } else {
          fixes.push({
            path: file.path,
            content: fixedContent,
            changes
          });
        }
      }
    }

    // Generate suggestions for unfixed errors
    for (const error of errors) {
      const wasFixed = fixes.some(f => f.changes.length > 0 && error.includes(f.path.split('/').pop() || ''));
      if (!wasFixed) {
        if (error.includes('cannot find symbol')) {
          suggestions.push('Check for missing imports or undefined variables');
        } else if (error.includes('incompatible types')) {
          suggestions.push('Verify variable types match expected types');
        } else if (error.includes('method does not override')) {
          suggestions.push('Check @Override methods match parent signatures exactly');
        } else {
          suggestions.push(`Manual review needed: ${error.substring(0, 100)}...`);
        }
      }
    }

    // Apply fixes to original files array
    const fixedFiles = files.map(file => {
      const fix = fixes.find(f => f.path === file.path);
      if (fix) {
        return { path: file.path, content: fix.content };
      }
      return file;
    });

    const allChanges = fixes.flatMap(f => f.changes);
    
    return new Response(
      JSON.stringify({
        success: true,
        fixedFiles,
        changes: allChanges,
        suggestions: [...new Set(suggestions)], // Remove duplicates
        message: allChanges.length > 0 
          ? `Applied ${allChanges.length} fix(es). Attempting rebuild...`
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
