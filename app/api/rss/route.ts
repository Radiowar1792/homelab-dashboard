import { NextResponse } from "next/server";
import { z } from "zod";

// Schéma de validation
const RSSFetchSchema = z.object({
  url: z.string().url("URL de flux RSS invalide"),
  limit: z.number().min(1).max(50).optional().default(10),
});

/**
 * POST /api/rss — Fetch et parse un flux RSS
 * Utilise rss-parser pour convertir XML → JSON
 */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const { url, limit } = RSSFetchSchema.parse(body);

    // Import dynamique pour éviter les problèmes de SSR
    const Parser = (await import("rss-parser")).default;
    const parser = new Parser({
      timeout: 10000,
      headers: {
        "User-Agent": "Homelab-Dashboard/1.0 RSS Reader",
      },
    });

    const feed = await parser.parseURL(url);

    const items = feed.items.slice(0, limit).map((item) => ({
      title: item.title ?? "Sans titre",
      link: item.link ?? "",
      description: item.contentSnippet ?? item.summary ?? "",
      pubDate: item.pubDate ?? item.isoDate ?? null,
      author: item.creator ?? item.author ?? null,
      categories: item.categories ?? [],
    }));

    return NextResponse.json({
      title: feed.title,
      description: feed.description,
      link: feed.link,
      items,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "URL invalide", details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Impossible de récupérer le flux RSS", details: String(error) },
      { status: 502 }
    );
  }
}
