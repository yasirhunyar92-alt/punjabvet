import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, geminiImage, geminiText, GeminiError, jsonError, parseJson, toInlineImage } from "../_shared/gemini.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, action } = await req.json();
    if (!imageUrl) throw new GeminiError("imageUrl is required", 400);

    const imagePart = await toInlineImage(imageUrl);

    if (action === "remove-bg") {
      const editedImage = await geminiImage({
        parts: [
          {
            text: "Remove the background from this product completely and replace it with a clean pure white studio background. Keep the product sharp, well-lit, centered, and photorealistic. Output only the edited image.",
          },
          imagePart,
        ],
      });

      if (!editedImage) {
        return jsonError("AI did not return an image. Try a clearer photo.", 502);
      }

      return new Response(JSON.stringify({ editedImage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "analyze") {
      const raw = await geminiText({
        json: true,
        parts: [
          {
            text: `You are an expert at identifying veterinary/animal medicine products. Analyze this product image and extract all visible information. Return a JSON object with these fields (leave empty string if not visible):
{
  "name": "product name in English",
  "name_ur": "product name in Urdu if visible, otherwise empty",
  "description": "brief product description in English (2-3 sentences about what the product is, its use)",
  "description_ur": "brief product description in Urdu",
  "price": price as number only, 0 if not visible,
  "brand": "brand name if visible",
  "volume_size": "volume/weight if visible e.g. 100ml, 500g",
  "tags": ["relevant", "tags"],
  "animal_type": ["from: Cow, Buffalo, Goat, Sheep, Poultry, Horse, Dog, Cat"],
  "usage_instructions": "usage instructions in English if visible or inferrable",
  "usage_instructions_ur": "usage instructions in Urdu",
  "batch_number": "batch number if visible",
  "expiry_date": "expiry date in YYYY-MM-DD format if visible"
}
Only return valid JSON, nothing else.`,
          },
          imagePart,
        ],
      });

      return new Response(JSON.stringify({ productInfo: parseJson(raw) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new GeminiError("Invalid action. Use 'remove-bg' or 'analyze'", 400);
  } catch (e) {
    const status = e instanceof GeminiError ? e.status : 500;
    console.error("ai-product-analyze error:", e);
    return jsonError(e instanceof Error ? e.message : "Unknown error", status);
  }
});
