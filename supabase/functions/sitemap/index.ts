// Dynamic XML sitemaps + RSS feed for PunjabVeterinary.com
// Always returns XML with the correct Content-Type (never HTML / React output).
//
// Endpoints (via ?type=, or the trailing path segment):
//   index      -> sitemap index listing every child sitemap
//   pages      -> static pages
//   products   -> product detail pages
//   categories -> category listing pages
//   blog       -> published blog posts
//   images     -> image sitemap (products + blog covers)
//   rss        -> RSS 2.0 feed of latest blog posts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE_URL = "https://punjabveterinary.com";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const xmlHeaders = (contentType = "application/xml") => ({
  "Content-Type": `${contentType}; charset=utf-8`,
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
  "Access-Control-Allow-Origin": "*",
  "X-Robots-Tag": "noindex",
});

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const day = (d?: string | null) =>
  d ? new Date(d).toISOString().split("T")[0] : undefined;

type Entry = {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
  images?: { url: string; title?: string; caption?: string }[];
};

function urlset(entries: Entry[], withImages = false) {
  const body = entries
    .map((e) => {
      const parts = [`    <loc>${esc(e.loc)}</loc>`];
      if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`);
      if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
      if (e.priority) parts.push(`    <priority>${e.priority}</priority>`);
      if (withImages) {
        for (const img of e.images ?? []) {
          parts.push(
            `    <image:image>`,
            `      <image:loc>${esc(img.url)}</image:loc>`,
            img.title ? `      <image:title>${esc(img.title)}</image:title>` : "",
            img.caption ? `      <image:caption>${esc(img.caption)}</image:caption>` : "",
            `    </image:image>`,
          );
        }
      }
      return [`  <url>`, ...parts.filter(Boolean), `  </url>`].join("\n");
    })
    .join("\n");

  const ns = [
    `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`,
    withImages ? `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset ${ns}>\n${body}\n</urlset>`;
}

async function staticEntries(): Promise<Entry[]> {
  const paths: [string, string, string][] = [
    ["/", "daily", "1.0"],
    ["/products", "daily", "0.9"],
    ["/blog", "daily", "0.8"],
    ["/about", "monthly", "0.6"],
    ["/contact", "monthly", "0.6"],
    ["/shipping", "monthly", "0.4"],
    ["/refund", "monthly", "0.4"],
    ["/privacy", "yearly", "0.3"],
    ["/terms", "yearly", "0.3"],
  ];
  return paths.map(([p, changefreq, priority]) => ({
    loc: `${SITE_URL}${p}`,
    changefreq,
    priority,
  }));
}

async function productRows() {
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, description, image_url, images, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5000);
  if (error) throw error;
  return data ?? [];
}

async function blogRows() {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug, title, excerpt, cover_image, category, published_at, updated_at")
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(5000);
  if (error) throw error;
  return data ?? [];
}

async function categoryRows() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, created_at")
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

async function buildProducts() {
  const rows = await productRows();
  return urlset(
    rows.map((p) => ({
      loc: `${SITE_URL}/product/${p.slug || p.id}`,
      lastmod: day(p.updated_at),
      changefreq: "weekly",
      priority: "0.8",
    })),
  );
}

async function buildBlog() {
  const rows = await blogRows();
  return urlset(
    rows.map((b) => ({
      loc: `${SITE_URL}/blog/${b.slug}`,
      lastmod: day(b.updated_at || b.published_at),
      changefreq: "weekly",
      priority: "0.75",
    })),
  );
}

async function buildCategories() {
  const rows = await categoryRows();
  return urlset(
    rows.map((c) => ({
      loc: `${SITE_URL}/products?category=${encodeURIComponent(c.id)}`,
      lastmod: day(c.created_at),
      changefreq: "weekly",
      priority: "0.7",
    })),
  );
}

async function buildImages() {
  const [products, posts] = await Promise.all([productRows(), blogRows()]);
  const entries: Entry[] = [];

  for (const p of products) {
    const urls = [p.image_url, ...((p.images as string[] | null) ?? [])].filter(
      (u): u is string => typeof u === "string" && u.startsWith("http"),
    );
    if (!urls.length) continue;
    entries.push({
      loc: `${SITE_URL}/product/${p.slug || p.id}`,
      lastmod: day(p.updated_at),
      images: [...new Set(urls)].slice(0, 20).map((url) => ({
        url,
        title: p.name,
        caption: (p.description ?? "").slice(0, 160) || p.name,
      })),
    });
  }

  for (const b of posts) {
    if (!b.cover_image?.startsWith("http")) continue;
    entries.push({
      loc: `${SITE_URL}/blog/${b.slug}`,
      lastmod: day(b.updated_at || b.published_at),
      images: [{ url: b.cover_image, title: b.title, caption: b.excerpt ?? b.title }],
    });
  }

  return urlset(entries, true);
}

async function buildStatic() {
  return urlset(await staticEntries());
}

function buildIndex() {
  const now = new Date().toISOString();
  const children = ["pages", "products", "categories", "blog", "images"];
  const body = children
    .map(
      (c) =>
        `  <sitemap>\n    <loc>${SITE_URL}/sitemap-${c}.xml</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`;
}

async function buildRss() {
  const rows = (await blogRows()).slice(0, 50);
  const items = rows
    .map((b) =>
      [
        `    <item>`,
        `      <title>${esc(b.title)}</title>`,
        `      <link>${SITE_URL}/blog/${esc(b.slug)}</link>`,
        `      <guid isPermaLink="true">${SITE_URL}/blog/${esc(b.slug)}</guid>`,
        `      <description>${esc(b.excerpt ?? "")}</description>`,
        b.category ? `      <category>${esc(b.category)}</category>` : "",
        `      <pubDate>${new Date(b.published_at ?? Date.now()).toUTCString()}</pubDate>`,
        b.cover_image
          ? `      <enclosure url="${esc(b.cover_image)}" type="image/png" length="0" />`
          : "",
        `      <author>info@punjabveterinary.com (Punjab Veterinary Medical Store)</author>`,
        `    </item>`,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Punjab Veterinary Medical Store — Blog</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Livestock, poultry and pet health guides from Punjab Veterinary Medical Store, Sillanwali.</description>
    <language>en-pk</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;
}

function resolveType(url: URL): string {
  const q = url.searchParams.get("type");
  if (q) return q.toLowerCase();
  const last = url.pathname.split("/").filter(Boolean).pop() ?? "";
  const m = last.match(/^sitemap(?:-([a-z]+))?\.xml$/i);
  if (m) return (m[1] ?? "index").toLowerCase();
  if (/^rss\.xml$/i.test(last)) return "rss";
  return "index";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, apikey, content-type",
      },
    });
  }

  const url = new URL(req.url);
  const type = resolveType(url);

  try {
    switch (type) {
      case "rss":
        return new Response(await buildRss(), { headers: xmlHeaders("application/rss+xml") });
      case "pages":
      case "static":
        return new Response(await buildStatic(), { headers: xmlHeaders() });
      case "products":
        return new Response(await buildProducts(), { headers: xmlHeaders() });
      case "categories":
        return new Response(await buildCategories(), { headers: xmlHeaders() });
      case "blog":
        return new Response(await buildBlog(), { headers: xmlHeaders() });
      case "images":
        return new Response(await buildImages(), { headers: xmlHeaders() });
      case "index":
      default:
        return new Response(buildIndex(), { headers: xmlHeaders() });
    }
  } catch (e) {
    console.error("sitemap error:", e instanceof Error ? e.message : e);
    // Never return HTML — emit a minimal valid XML document instead.
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE_URL}/</loc></url>\n</urlset>`,
      { status: 200, headers: xmlHeaders() },
    );
  }
});
