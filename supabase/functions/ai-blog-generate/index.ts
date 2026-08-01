import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, geminiImage, geminiText, GeminiError, jsonError, parseJson } from "../_shared/gemini.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic } = await req.json();
    if (!topic) throw new GeminiError("topic is required", 400);

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

    const raw = await geminiText({
      system: systemPrompt,
      parts: [{ text: userPrompt }],
      json: true,
    });
    const parsed = parseJson(raw);

    // Generate cover image
    let cover_image: string | null = null;
    try {
      const imgPrompt = parsed.image_prompt || `Photorealistic cover image for a veterinary blog: ${topic}. Bright natural lighting, no text.`;
      const dataUrl = await geminiImage({ parts: [{ text: imgPrompt }] });

      if (dataUrl) {
        const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
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
    } catch (e) {
      console.error("cover image generation skipped:", e instanceof Error ? e.message : e);
    }

    parsed.cover_image = cover_image;

    return new Response(JSON.stringify({ post: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const status = err instanceof GeminiError ? err.status : 500;
    console.error("ai-blog-generate error:", err);
    return jsonError(err instanceof Error ? err.message : "Unknown error", status);
  }
});
