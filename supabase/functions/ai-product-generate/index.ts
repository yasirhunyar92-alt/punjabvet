import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert veterinary pharmaceutical database for Pakistan. Given a veterinary medicine or livestock product (by name, URL, image, or PDF), return authentic, accurate details. Use your knowledge of Pakistani and international veterinary brands (Selmox, Tygent, Ketoject, Oxytetracycline, Ivermectin brands, Star Laboratories, ICI, Selmore, Vetnex, Hi-Tech, Farvet, Wan-Bury, MSD, Zoetis, Elanco, etc.). Never fabricate a fake manufacturer. Output STRICT JSON only.`;

const buildUserInstruction = (categoryHints: string[]) => `Return ONLY this JSON (no markdown):
{
  "name": "clean English product name",
  "name_ur": "Urdu transliteration or translation",
  "brand": "brand name",
  "generic_name": "active ingredient / generic name",
  "manufacturer": "manufacturer name",
  "company": "marketing company",
  "category": "MUST be one of the existing categories if a good match exists: ${categoryHints.join(' | ') || 'General'}. Otherwise pick the closest.",
  "category_confidence": 0.0-1.0 confidence that the category is correct,
  "sub_category": "specific sub-category",
  "dosage_form": "e.g. Injection, Tablet, Oral Suspension, Bolus, Powder, Spray",
  "composition": "active ingredients with strengths",
  "strength": "e.g. 150 mg/ml",
  "pack_size": "e.g. 100 ml vial",
  "volume_size": "shorthand e.g. 100ml",
  "animal_type": ["array of: Cow, Buffalo, Goat, Sheep, Poultry, Horse, Dog, Cat"],
  "indications": "primary uses and indications",
  "benefits": "key benefits",
  "description": "detailed English description 3-5 sentences",
  "description_ur": "Urdu description",
  "short_description": "one-line English tagline",
  "usage_instructions": "detailed dosage & administration English",
  "usage_instructions_ur": "Urdu dosage instructions",
  "contraindications": "contraindications",
  "warnings": "warnings & withdrawal period",
  "storage_instructions": "storage requirements",
  "sku": "auto-generated SKU like BRAND-NAME-SIZE",
  "seo_title": "<=60 chars SEO title + Pakistan",
  "seo_description": "<=160 chars meta description",
  "seo_keywords": ["8-12 keywords incl. urdu"],
  "tags": ["6-10 short tags"],
  "official_website": "manufacturer's site if known else empty",
  "source_url": "reliable source URL if known else empty",
  "suggested_price_pkr": estimated Pakistan retail price as number,
  "image_search_query": "specific query to find real product photo"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { productName, productUrl, imageBase64, imageMime, pdfBase64, pdfName, existingCategories } = await req.json();

    const categoryHints: string[] = Array.isArray(existingCategories) ? existingCategories : [];

    let userContent: any;
    const instr = buildUserInstruction(categoryHints);

    if (imageBase64) {
      const mime = imageMime || "image/jpeg";
      userContent = [
        { type: "text", text: `Identify this veterinary product from the image and generate a complete listing.\n\n${instr}` },
        { type: "image_url", image_url: { url: `data:${mime};base64,${imageBase64}` } },
      ];
    } else if (pdfBase64) {
      userContent = [
        { type: "text", text: `Extract the veterinary product details from this PDF and generate a complete listing.\n\n${instr}` },
        { type: "file", file: { filename: pdfName || "catalog.pdf", file_data: `data:application/pdf;base64,${pdfBase64}` } },
      ];
    } else if (productUrl) {
      userContent = `Research this product page and generate a complete listing.\nURL: ${productUrl}\n\n${instr}`;
    } else if (productName) {
      userContent = `Generate a complete product listing for: "${productName}".\n\n${instr}`;
    } else {
      throw new Error("Provide productName, productUrl, imageBase64, or pdfBase64");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Plans & credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("Generation failed");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let product: Record<string, unknown> = {};
    try { product = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      product = m ? JSON.parse(m[0]) : {};
    }

    return new Response(JSON.stringify({ product }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("ai-product-generate error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
