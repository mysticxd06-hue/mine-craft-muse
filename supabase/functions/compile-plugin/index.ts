import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COMPILER_URL = "http://51.75.43.105:3000/compile";
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

interface PluginFile {
  path: string;
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { files, pluginName, javaVersion = "17" } = await req.json() as {
      files: PluginFile[];
      pluginName: string;
      javaVersion?: string;
    };

    console.log(`User ${user.id} compiling ${pluginName} (${files.length} files, Java ${javaVersion})`);

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No files provided', message: 'No files to compile.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Forward to self-hosted compiler
    let compileResp: Response;
    try {
      compileResp = await fetch(COMPILER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, pluginName, javaVersion }),
      });
    } catch (e) {
      console.error('Compiler fetch failed:', e);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Compiler unreachable',
          message: `Could not reach compiler server: ${e instanceof Error ? e.message : 'Unknown error'}`,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawText = await compileResp.text();
    let result: any;
    try {
      result = JSON.parse(rawText);
    } catch {
      console.error('Non-JSON response from compiler:', rawText.slice(0, 500));
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid compiler response',
          message: rawText.slice(0, 1000) || 'Compiler returned non-JSON response',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!compileResp.ok || result.success === false) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || `Compiler error ${compileResp.status}`,
          message: result.message || result.output || result.error || 'Compilation failed',
          output: result.output,
          results: result.results || [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Success — pass JAR through
    return new Response(
      JSON.stringify({
        success: true,
        message: result.message || `✓ ${pluginName} compiled successfully!`,
        jar: result.jar,
        filename: result.filename || `${pluginName}.jar`,
        output: result.output,
        javaVersion,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in compile-plugin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, message: `Error: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
