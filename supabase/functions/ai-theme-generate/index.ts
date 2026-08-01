import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, geminiText, GeminiError, jsonError, parseJson } from "../_shared/gemini.ts";

const SYSTEM_PROMPT = `You are a senior brand & UI designer creating festive seasonal themes for "Punjab Veterinary Medical Store", a Pakistani veterinary e-commerce store. Given an occasion (e.g. 14 August Independence Day, Eid, Ramadan, Winter Sale, Kisan Mela), design a tasteful, high-contrast, accessible light theme.

Rules:
- All colors MUST be plain HSL triplets as "H S% L%" (no hsl(), no commas at the end), because they are injected into CSS variables.
- Text on a colored surface must stay readable: keep *-foreground values very light on dark backgrounds and very dark on light backgrounds.
- Backgrounds stay light and clean (L between 94% and 100%); primary is a strong saturated brand color; accent is a complementary highlight.
- Never return neon or fully saturated eye-straining values (cap S at 90%).
Output STRICT JSON only, no markdown.`;

const SHAPE = `{
  "name": "short theme name in English",
  "occasion": "the occasion this celebrates",
  "banner_text": "short festive promo line in English (max 70 chars)",
  "banner_text_ur": "the same line in Urdu",
  "tokens": {
    "background": "H S% L%",
    "foreground": "H S% L%",
    "card": "H S% L%",
    "card-foreground": "H S% L%",
    "popover": "H S% L%",
    "popover-foreground": "H S% L%",
    "primary": "H S% L%",
    "primary-foreground": "H S% L%",
    "secondary": "H S% L%",
    "secondary-foreground": "H S% L%",
    "muted": "H S% L%",
    "muted-foreground": "H S% L%",
    "accent": "H S% L%",
    "accent-foreground": "H S% L%",
    "border": "H S% L%",
    "input": "H S% L%",
    "ring": "H S% L%",
    "gold": "H S% L%",
    "gold-foreground": "H S% L%"
  }
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { occasion, notes } = await req.json();
    if (!occasion) throw new GeminiError("occasion is required", 400);

    const raw = await geminiText({
      system: SYSTEM_PROMPT,
      json: true,
      parts: [
        {
          text: `Design a seasonal website theme for this occasion: "${occasion}".${
            notes ? `\nExtra direction from the store owner: ${notes}` : ""
          }\n\nReturn ONLY this JSON:\n${SHAPE}`,
        },
      ],
    });

    const theme = parseJson(raw);
    if (!theme?.tokens || typeof theme.tokens !== "object") {
      throw new GeminiError("AI did not return a valid theme. Try rephrasing the occasion.", 502);
    }

    return new Response(JSON.stringify({ theme }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const status = err instanceof GeminiError ? err.status : 500;
    console.error("ai-theme-generate error:", err);
    return jsonError(err instanceof Error ? err.message : "Unknown error", status);
  }
});
