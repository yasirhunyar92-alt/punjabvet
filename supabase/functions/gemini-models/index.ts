import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getGeminiKey } from "../_shared/gemini.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${getGeminiKey()}&pageSize=200`);
  const data = await res.json();
  const names = (data.models ?? []).map((m: any) => m.name);
  return new Response(JSON.stringify({ names }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
