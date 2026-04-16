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

    const { imageUrl, action } = await req.json();
    if (!imageUrl) throw new Error("imageUrl is required");

    if (action === "remove-bg") {
      // Use image model to remove background and make professional
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Remove the background from this product image completely. Make it a clean, professional product photo with a pure white background. Keep the product sharp and well-lit. Return only the edited image." },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI image error:", response.status, t);
        if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("Image processing failed");
      }

      const data = await response.json();
      const editedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      return new Response(JSON.stringify({ editedImage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "analyze") {
      // Analyze image to auto-fill product form
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `You are an expert at identifying veterinary/animal medicine products. Analyze this product image and extract all visible information. Return a JSON object with these fields (leave empty string if not visible):
{
  "name": "product name in English",
  "name_ur": "product name in Urdu if visible, otherwise empty",
  "description": "brief product description in English based on what you see (2-3 sentences about what the product is, its use)",
  "description_ur": "brief product description in Urdu",
  "price": "price as number only, 0 if not visible",
  "brand": "brand name if visible",
  "volume_size": "volume/weight if visible e.g. 100ml, 500g",
  "tags": ["relevant", "tags", "for", "this", "product"],
  "animal_type": ["which animals this is for, from: Cow, Buffalo, Goat, Sheep, Poultry, Horse, Dog, Cat"],
  "usage_instructions": "usage instructions in English if visible or inferrable",
  "usage_instructions_ur": "usage instructions in Urdu",
  "batch_number": "batch number if visible",
  "expiry_date": "expiry date in YYYY-MM-DD format if visible"
}
Only return valid JSON, nothing else.`,
                },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_product_info",
                description: "Extract product information from image",
                parameters: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    name_ur: { type: "string" },
                    description: { type: "string" },
                    description_ur: { type: "string" },
                    price: { type: "number" },
                    brand: { type: "string" },
                    volume_size: { type: "string" },
                    tags: { type: "array", items: { type: "string" } },
                    animal_type: { type: "array", items: { type: "string" } },
                    usage_instructions: { type: "string" },
                    usage_instructions_ur: { type: "string" },
                    batch_number: { type: "string" },
                    expiry_date: { type: "string" },
                  },
                  required: ["name", "description", "tags"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "extract_product_info" } },
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI analyze error:", response.status, t);
        if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      let productInfo = {};
      
      if (toolCall?.function?.arguments) {
        try {
          productInfo = JSON.parse(toolCall.function.arguments);
        } catch {
          // Try parsing from content as fallback
          const content = data.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) productInfo = JSON.parse(jsonMatch[0]);
        }
      }

      return new Response(JSON.stringify({ productInfo }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action. Use 'remove-bg' or 'analyze'");
  } catch (e) {
    console.error("ai-product-analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
