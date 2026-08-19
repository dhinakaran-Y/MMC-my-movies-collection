import { NextResponse } from "next/server";
import { getTitleSources } from "@/lib/providers/watchmodeAdapter";

const sourcesCache = new Map();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const titleId = searchParams.get("id");
    const region = searchParams.get("region") || "US";

    if (!titleId) {
      return NextResponse.json([]);
    }

    const cacheKey = `${titleId}:${region}`;
    if (sourcesCache.has(cacheKey)) {
      return NextResponse.json(sourcesCache.get(cacheKey));
    }

    const sources = await getTitleSources(titleId, region);
    const formatted = (sources || []).map((s) => ({
      provider_id: s.source_id || s.id,
      provider_name: s.name,
      logo_path: null,
      web_url: s.web_url,
      type: s.type,
    }));

    sourcesCache.set(cacheKey, formatted);
    // Keep cache size bounded
    if (sourcesCache.size > 1000) {
      const firstKey = sourcesCache.keys().next().value;
      sourcesCache.delete(firstKey);
    }

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Watchmode title-sources API route error:", error);
    return NextResponse.json([]);
  }
}
