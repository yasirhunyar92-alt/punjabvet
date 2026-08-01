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

async function callGemini(model: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/${model}:generateContent?key=${getGeminiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Gemini error:", res.status, text.slice(0, 600));
    if (res.status === 429) throw new GeminiError("Gemini rate limit reached, try again shortly", 429);
    if (res.status === 403 || res.status === 401) throw new GeminiError("Gemini API key is invalid or lacks access", 401);
    throw new GeminiError("Gemini request failed", 502);
  }

  return await res.json();
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
 * Generate or edit an image. Returns a data URL, or undefined if the model
 * returned no image.
 */
export async function geminiImage(opts: {
  parts: GeminiPart[];
  model?: string;
}): Promise<string | undefined> {
  const data = await callGemini(opts.model ?? "gemini-3.1-flash-image", {
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
  return undefined;
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
