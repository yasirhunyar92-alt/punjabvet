import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, geminiText, GeminiError, jsonError, parseJson, type GeminiPart } from "../_shared/gemini.ts";

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
    const { productName, productUrl, imageBase64, imageMime, pdfBase64, existingCategories } = await req.json();

    const categoryHints: string[] = Array.isArray(existingCategories) ? existingCategories : [];
    const instr = buildUserInstruction(categoryHints);

    let parts: GeminiPart[];

    if (imageBase64) {
      parts = [
        { text: `Identify this veterinary product from the image and generate a complete listing.\n\n${instr}` },
        { inline_data: { mime_type: imageMime || "image/jpeg", data: imageBase64 } },
      ];
    } else if (pdfBase64) {
      parts = [
        { text: `Extract the veterinary product details from this PDF and generate a complete listing.\n\n${instr}` },
        { inline_data: { mime_type: "application/pdf", data: pdfBase64 } },
      ];
    } else if (productUrl) {
      parts = [{ text: `Research this product page and generate a complete listing.\nURL: ${productUrl}\n\n${instr}` }];
    } else if (productName) {
      parts = [{ text: `Generate a complete product listing for: "${productName}".\n\n${instr}` }];
    } else {
      throw new GeminiError("Provide productName, productUrl, imageBase64, or pdfBase64", 400);
    }

    const raw = await geminiText({ model: "gemini-3-pro-preview", system: SYSTEM_PROMPT, parts, json: true });

    return new Response(JSON.stringify({ product: parseJson(raw) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const status = err instanceof GeminiError ? err.status : 500;
    console.error("ai-product-generate error:", err);
    return jsonError(err instanceof Error ? err.message : "Unknown error", status);
  }
});
