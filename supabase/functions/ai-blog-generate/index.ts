import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { topic } = await req.json();
    if (!topic) throw new Error("topic is required");

    const systemPrompt = `You are an expert veterinary content writer for Punjab Veterinary Medical Store, Sillanwali, Pakistan. Write SEO-optimized, helpful, accurate blog posts for Pakistani farmers and pet owners about livestock health, vaccines, dairy supplements, poultry care, and pet care. Output STRICT JSON only — no markdown fences.`;

    const userPrompt = `Write a complete blog post on: "${topic}".

Return ONLY this JSON shape (no extra text):
{
  "title": "English title (60 chars max, SEO friendly)",
  "title_ur": "Urdu translation of title",
  "slug": "url-friendly-slug-lowercase-hyphenated",
  "excerpt": "English excerpt 140-160 chars",
  "excerpt_ur": "Urdu excerpt",
  "content": "Full English article 600-900 words with markdown ## headings and bullet points",
  "content_ur": "Full Urdu translation",
  "seo_title": "SEO title <=60 chars",
  "seo_description": "Meta description <=160 chars",
  "category": "one of: Livestock | Poultry | Pets | Dairy | Vaccines | General",
  "tags": ["3-6","relevant","keywords"],
  "image_prompt": "A single vivid English sentence describing a photorealistic wide cover image for this blog: subject, setting (Pakistani farm / rural Punjab where appropriate), lighting, no text or watermarks"
}`;

    const textRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!textRes.ok) {
      const t = await textRes.text();
      console.error("AI text error:", textRes.status, t);
      if (textRes.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (textRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("Generation failed");
    }

    const data = await textRes.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, any> = {};
    try { parsed = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }

    // Generate cover image
    let cover_image: string | null = null;
    try {
      const imgPrompt = parsed.image_prompt || `Photorealistic cover image for a veterinary blog: ${topic}. Bright natural lighting, no text.`;
      const imgRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: [{ type: "text", text: imgPrompt }] }],
          modalities: ["image", "text"],
        }),
      });

      if (imgRes.ok) {
        const imgData = await imgRes.json();
        const msg = imgData.choices?.[0]?.message ?? {};
        let dataUrl: string | undefined =
          msg.images?.[0]?.image_url?.url ||
          msg.images?.[0]?.url ||
          (Array.isArray(msg.content) ? msg.content.find((c: any) => c?.image_url?.url)?.image_url?.url : undefined);

        if (dataUrl) {
          const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
          const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
          const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          );
          const fileName = `blog/${Date.now()}-${crypto.randomUUID()}.png`;
          const { error: upErr } = await supabase.storage.from("product-images").upload(fileName, bytes, { contentType: "image/png" });
          if (!upErr) {
            const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
            cover_image = urlData.publicUrl;
          } else {
            console.error("upload err:", upErr.message);
          }
        }
      } else {
        console.error("img gen non-ok:", imgRes.status, await imgRes.text());
      }
    } catch (e) {
      console.error("cover image generation skipped:", e instanceof Error ? e.message : e);
    }

    parsed.cover_image = cover_image;

    return new Response(JSON.stringify({ post: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("ai-blog-generate error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
