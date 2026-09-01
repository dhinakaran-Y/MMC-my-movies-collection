import { NextResponse } from "next/server";
import { searchAllProviders } from "@/lib/providers/multiProviderSearch";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";

    if (!query.trim()) {
      return NextResponse.json({
        results: [],
        providerCounts: { tmdb: 0, anilist: 0, tvmaze: 0, watchmode: 0, omdb: 0 },
        total_results: 0,
        total_pages: 1,
      });
    }

    const data = await searchAllProviders(query);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Multi-provider search API route error:", error);
    return NextResponse.json(
      { error: "Failed to perform multi-provider search", results: [], total_pages: 1 },
      { status: 500 }
    );
  }
}
