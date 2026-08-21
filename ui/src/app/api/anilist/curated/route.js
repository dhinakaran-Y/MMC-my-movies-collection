import { NextResponse } from "next/server";
import { getCuratedRows } from "@/lib/providers/anilistAdapter";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "ANIME").toUpperCase();

    const data = await getCuratedRows(type);
    return NextResponse.json(data);
  } catch (error) {
    console.error("AniList API curated route error:", error);
    return NextResponse.json(
      {
        trendingNow: [],
        popularThisSeason: [],
        upcomingNextSeason: [],
        allTimePopular: [],
        top100: [],
        error: error.message,
      },
      { status: 500 },
    );
  }
}
