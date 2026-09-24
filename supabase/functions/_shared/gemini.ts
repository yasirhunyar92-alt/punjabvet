// Shared Google Gemini API helpers (uses GEMINI_API_KEY secret directly)

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function getGeminiKey(): string {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return key;
}

export type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

export function jsonError(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Text model fallbacks used when the primary model is overloaded. */
const TEXT_FALLBACKS = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.0-flash"];

async function rawCall(model: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/${model}:generateContent?key=${getGeminiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res;
}

async function callGemini(model: string, body: Record<string, unknown>) {
  // Try the requested model, then alternates, retrying transient overloads.
  const models = TEXT_FALLBACKS.includes(model)
    ? [model, ...TEXT_FALLBACKS.filter((m) => m !== model)]
    : [model];

  let lastStatus = 0;
  for (const m of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await rawCall(m, body);
      if (res.ok) return await res.json();

      const text = await res.text();
      lastStatus = res.status;
      console.error(`Gemini error (${m}, attempt ${attempt + 1}):`, res.status, text.slice(0, 300));

      if (res.status === 403 || res.status === 401) {
        throw new GeminiError("Gemini API key is invalid or lacks access", 401);
      }
      if (res.status === 429 || res.status === 503 || res.status >= 500) {
        await sleep(700 * (attempt + 1));
        continue; // transient — retry, then fall through to the next model
      }
      if (res.status === 404 && models.length > 1) break; // model unavailable — try next
      throw new GeminiError("The AI could not process this request. Try a clearer image or different input.", 400);
    }
  }

  if (lastStatus === 429) throw new GeminiError("Gemini rate limit reached, try again shortly", 429);
  throw new GeminiError("The AI service is busy right now. Please try again in a moment.", 503);
}

export class GeminiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

/** Generate text (optionally strict JSON) from parts. */
export async function geminiText(opts: {
  model?: string;
  system?: string;
  parts: GeminiPart[];
  json?: boolean;
}): Promise<string> {
  const data = await callGemini(opts.model ?? "gemini-3.6-flash", {
    contents: [{ role: "user", parts: opts.parts }],
    ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
    generationConfig: {
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
      temperature: 0.6,
    },
  });

  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p: any) => p?.text ?? "").join("").trim();
}

/** Parse JSON leniently from a model response. */
export function parseJson<T = Record<string, any>>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]) as T;
      } catch { /* ignore */ }
    }
    return {} as T;
  }
}

/**
 * Generate or edit an image. Returns a data URL, or undefined if no image was
 * produced. Image models are not available on every Gemini API plan, so this
 * transparently falls back to the Lovable AI image model when the Gemini key
 * has no image quota.
 */
export async function geminiImage(opts: {
  parts: GeminiPart[];
  model?: string;
}): Promise<string | undefined> {
  try {
    const data = await callGemini(opts.model ?? "gemini-2.5-flash-image", {
      contents: [{ role: "user", parts: opts.parts }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    });

    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    for (const p of parts) {
      const inline = p?.inlineData ?? p?.inline_data;
      if (inline?.data) {
        const mime = inline.mimeType ?? inline.mime_type ?? "image/png";
        return `data:${mime};base64,${inline.data}`;
      }
    }
    console.error("No image part in Gemini response:", JSON.stringify(data).slice(0, 400));
  } catch (e) {
    console.error("Gemini image failed, trying fallback:", e instanceof Error ? e.message : e);
  }

  return await fallbackImage(opts.parts);
}

/** Lovable AI image fallback (used when the Gemini key has no image quota). */
async function fallbackImage(parts: GeminiPart[]): Promise<string | undefined> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return undefined;

  const content = parts.map((p: any) =>
    "text" in p
      ? { type: "text", text: p.text }
      : { type: "image_url", image_url: { url: `data:${p.inline_data.mime_type};base64,${p.inline_data.data}` } }
  );

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content }],
      modalities: ["image", "text"],
    }),
  });

  if (!res.ok) {
    console.error("fallback image error:", res.status, (await res.text()).slice(0, 300));
    return undefined;
  }

  const data = await res.json();
  const msg = data.choices?.[0]?.message ?? {};
  let url: string | undefined =
    msg.images?.[0]?.image_url?.url ||
    msg.images?.[0]?.url ||
    (Array.isArray(msg.content) ? msg.content.find((c: any) => c?.image_url?.url)?.image_url?.url : undefined);
  if (url && !url.startsWith("data:")) url = `data:image/png;base64,${url}`;
  return url;
}


/** Fetch a remote image (or pass through a data URL) as inline Gemini data. */
export async function toInlineImage(url: string): Promise<GeminiPart> {
  if (url.startsWith("data:")) {
    const [head, b64] = url.split(",");
    const mime = head.match(/data:([^;]+)/)?.[1] ?? "image/png";
    return { inline_data: { mime_type: mime, data: b64 } };
  }
  const res = await fetch(url);
  if (!res.ok) throw new GeminiError("Could not download the image", 400);
  const mime = res.headers.get("content-type") ?? "image/jpeg";
  const buf = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  for (let i = 0; i < buf.length; i += 8192) {
    binary += String.fromCharCode(...buf.subarray(i, i + 8192));
  }
  return { inline_data: { mime_type: mime.split(";")[0], data: btoa(binary) } };
}
