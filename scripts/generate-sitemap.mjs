import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const siteUrl = process.env.VITE_SITE_URL?.replace(/\/+$/, "");
const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/+$/, "");
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!siteUrl) {
  console.error("VITE_SITE_URL is required. Example: VITE_SITE_URL=https://community.example.com npm run seo:sitemap");
  process.exit(1);
}

const staticRoutes = ["/", "/community", "/communities", "/tags", "/users", "/badges"];
const today = new Date().toISOString().slice(0, 10);
const routes = staticRoutes.map((path) => ({ path, lastmod: today }));

const fetchPublicRows = async (table, select, query = "") => {
  if (!supabaseUrl || !supabaseKey) return [];
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${select}${query}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });
  if (!response.ok) throw new Error(`Unable to fetch ${table}: ${response.status}`);
  return response.json();
};

try {
  const [questions, communities, profiles] = await Promise.all([
    fetchPublicRows("questions", "id,created_at"),
    fetchPublicRows("communities", "slug,created_at,is_private", "&is_private=eq.false"),
    fetchPublicRows("profiles", "id,created_at"),
  ]);
  routes.push(
    ...questions.map((row) => ({ path: `/question/${row.id}`, lastmod: row.created_at?.slice(0, 10) || today })),
    ...communities.map((row) => ({ path: `/communities/${row.slug}`, lastmod: row.created_at?.slice(0, 10) || today })),
    ...profiles.map((row) => ({ path: `/user/${row.id}`, lastmod: row.created_at?.slice(0, 10) || today }))
  );
} catch (error) {
  console.warn(`Dynamic sitemap entries skipped: ${error.message}`);
}

const escapeXml = (value) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const urls = routes
  .map(
    ({ path, lastmod }) => `  <url>
    <loc>${escapeXml(`${siteUrl}${path}`)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`
  )
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const publicDir = resolve("public");
await mkdir(publicDir, { recursive: true });
await writeFile(resolve(publicDir, "sitemap.xml"), sitemap, "utf8");
await writeFile(
  resolve(publicDir, "robots.txt"),
  `User-agent: *
Allow: /
Disallow: /admin
Disallow: /auth
Disallow: /ask

Sitemap: ${siteUrl}/sitemap.xml
`,
  "utf8"
);
console.log(`Generated public/sitemap.xml for ${siteUrl}`);
