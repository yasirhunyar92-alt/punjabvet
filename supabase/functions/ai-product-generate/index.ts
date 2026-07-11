import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { productName } = await req.json();
    if (!productName || typeof productName !== "string") throw new Error("productName is required");

    const systemPrompt = `You are an expert veterinary pharmaceutical database for Pakistan. Given a veterinary medicine or livestock product name, return authentic, accurate details based on your knowledge of Pakistani and international veterinary brands (Selmox, Tygent, Ketoject, Oxytetracycline products, Ivermectin brands, Star Laboratories, ICI, Selmore, Vetnex, Hi-Tech, Farvet, Wan-Bury etc.). If uncertain about a specific field, provide a reasonable veterinary-standard value; never fabricate a fake manufacturer. Output STRICT JSON only.`;

    const userPrompt = `Generate a complete product listing for a Pakistani veterinary e-commerce store for: "${productName}".

Return ONLY this JSON (no markdown, no extra text):
{
  "name": "clean English product name",
  "name_ur": "Urdu transliteration or translation",
  "brand": "brand name",
  "generic_name": "active ingredient / generic name",
  "company": "marketing company",
  "manufacturer": "manufacturer name",
  "category": "one of: Antibiotics | Anti-parasitic | Vitamins & Minerals | Vaccines | Anti-inflammatory | Feed Supplements | Dewormers | Hormones | Antifungal | General",
  "sub_category": "specific sub-category",
  "animal_type": ["array of: Cow, Buffalo, Goat, Sheep, Poultry, Horse, Dog, Cat"],
  "description": "detailed English description 3-5 sentences",
  "description_ur": "Urdu description",
  "short_description": "one-line English tagline",
  "uses": "primary uses and indications, bullet-ready English text",
  "benefits": "key benefits English",
  "dosage_form": "e.g. Injection, Tablet, Oral Suspension, Bolus, Powder",
  "composition": "active ingredients with strengths",
  "strength": "e.g. 150 mg/ml",
  "pack_size": "e.g. 100 ml vial",
  "storage_instructions": "storage requirements",
  "warnings": "warnings, contraindications, withdrawal period",
  "usage_instructions": "detailed dosage & administration English",
  "usage_instructions_ur": "Urdu dosage instructions",
  "seo_title": "<=60 chars SEO title with keyword + Pakistan",
  "seo_description": "<=160 chars meta description",
  "seo_keywords": ["array", "of", "8-12", "keywords", "including", "urdu"],
  "tags": ["6-10 short tags"],
  "volume_size": "same as pack_size shorthand e.g. 100ml",
  "official_website": "manufacturer's official website URL if known, else empty string",
  "source_url": "reliable source URL if known, else empty string",
  "suggested_price_pkr": estimated retail price in Pakistan as a number (best guess),
  "image_search_query": "specific query to find real product photos e.g. 'Selmox LA Injection 100ml Star Laboratories bottle'"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
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
    try {
      product = JSON.parse(raw);
    } catch {
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
