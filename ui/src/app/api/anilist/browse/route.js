import { NextResponse } from "next/server";
import { browseMedia, searchMedia } from "@/lib/providers/anilistAdapter";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const page = Number(searchParams.get("page")) || 1;
    const type = (searchParams.get("type") || "ANIME").toUpperCase();

    if (query) {
      const data = await searchMedia(query, page, type);
      return NextResponse.json(data);
    }

    const data = await browseMedia({
      page,
      type,
      query: searchParams.get("query") || "",
      genre: searchParams.get("genre") || "",
      tag: searchParams.get("tag") || "",
      season: searchParams.get("season") || "",
      seasonYear: searchParams.get("seasonYear") || "",
      format: searchParams.get("format") || "",
      status: searchParams.get("status") || "",
      source: searchParams.get("source") || "",
      country: searchParams.get("country") || "",
      streamingOn: searchParams.get("streamingOn") || "",
      yearStart: searchParams.get("yearStart") || "",
      yearEnd: searchParams.get("yearEnd") || "",
      episodesMin: searchParams.get("episodesMin") || "",
      episodesMax: searchParams.get("episodesMax") || "",
      durationMin: searchParams.get("durationMin") || "",
      durationMax: searchParams.get("durationMax") || "",
      sortBy: searchParams.get("sortBy") || "POPULARITY_DESC",
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("AniList API browse route error:", error);
    return NextResponse.json(
      { results: [], total_pages: 1, error: error.message },
      { status: 500 },
    );
  }
}
