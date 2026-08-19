import { getAllPosts } from "@/lib/content";
import { siteUrl } from "@/lib/routes";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const posts = await getAllPosts();
  const updated = posts[0]?.date ?? "2026-04-25";
  const baseUrl = siteUrl();
  const entries = posts
    .map((post) => {
      const url = `${baseUrl}/evidence/${post.slug}`;
      return `<entry>
  <title>${escapeXml(post.title)}</title>
  <link href="${url}" />
  <id>${url}</id>
  <updated>${post.date}T00:00:00.000Z</updated>
  <summary>${escapeXml(post.dek)}</summary>
</entry>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Coconut Labs Evidence</title>
  <link href="${baseUrl}/evidence" />
  <link href="${baseUrl}/rss.xml" rel="self" />
  <author>
    <name>Coconut Labs</name>
    <email>info@coconutlabs.org</email>
  </author>
  <id>${baseUrl}/</id>
  <updated>${updated}T00:00:00.000Z</updated>
  ${entries}
</feed>`;

  return new Response(feed, {
    headers: {
      "content-type": "application/atom+xml; charset=utf-8",
    },
  });
}
