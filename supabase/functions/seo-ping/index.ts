// Submit URLs to IndexNow (Bing, Yandex, Naver, Seznam) so new products and
// blog posts get crawled within minutes instead of days.
// Admin-only: the caller's JWT must belong to a user with the `admin` role.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_HOST = "punjabveterinary.com";
const SITE_URL = `https://${SITE_HOST}`;
const INDEXNOW_KEY = "8f2b41c6d9a74e0fa1b35c7de6042198";
const KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;
const MAX_URLS = 10000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admin access required" }, 403);

    const body = await req.json().catch(() => ({}));
    let urls: string[] = Array.isArray(body?.urls) ? body.urls.filter((u: unknown) => typeof u === "string") : [];

    // No explicit list -> submit the whole public site.
    if (urls.length === 0) {
      const [{ data: products }, { data: posts }] = await Promise.all([
        admin.from("products").select("id, slug").eq("in_stock", true).limit(5000),
        admin.from("blog_posts").select("slug").eq("published", true).limit(2000),
      ]);

      urls = [
        "/", "/products", "/blog", "/about", "/contact", "/shipping", "/refund", "/privacy", "/terms",
        ...(products || []).map((p: any) => `/product/${p.slug || p.id}`),
        ...(posts || []).map((p: any) => `/blog/${p.slug}`),
      ];
    }

    const absolute = [...new Set(urls.map((u) => (u.startsWith("http") ? u : `${SITE_URL}${u.startsWith("/") ? u : `/${u}`}`)))]
      .filter((u) => u.startsWith(SITE_URL))
      .slice(0, MAX_URLS);

    if (absolute.length === 0) return json({ error: "No valid URLs to submit" }, 400);

    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: SITE_HOST,
        key: INDEXNOW_KEY,
        keyLocation: KEY_LOCATION,
        urlList: absolute,
      }),
    });

    const text = await res.text();
    console.log("IndexNow response", res.status, text.slice(0, 300), "urls:", absolute.length);

    return json({
      submitted: absolute.length,
      indexnow_status: res.status,
      ok: res.ok,
      message: res.ok
        ? `${absolute.length} URLs submitted to IndexNow (Bing, Yandex, Seznam, Naver).`
        : `IndexNow returned ${res.status}: ${text.slice(0, 200)}`,
      sample: absolute.slice(0, 5),
    }, res.ok ? 200 : 502);
  } catch (err) {
    console.error("seo-ping error:", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
