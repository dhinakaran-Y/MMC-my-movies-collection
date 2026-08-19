import { NextResponse } from "next/server";
import { browseMedia, searchMedia } from "@/lib/providers/watchmodeAdapter";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const page = Number(searchParams.get("page")) || 1;

    if (query) {
      const data = await searchMedia(query, page);
      return NextResponse.json(data);
    }

    const data = await browseMedia({
      page,
      region: searchParams.get("region") || "US",
      wmType: searchParams.get("wmType") || "",
      serviceTypes: searchParams.get("serviceTypes") || "",
      sourceIds: searchParams.get("sourceIds") || "",
      genre: searchParams.get("genre") || "",
      yearStart: searchParams.get("yearStart") || "",
      yearEnd: searchParams.get("yearEnd") || "",
      ratingLow: searchParams.get("ratingLow") || "",
      ratingHigh: searchParams.get("ratingHigh") || "",
      criticLow: searchParams.get("criticLow") || "",
      criticHigh: searchParams.get("criticHigh") || "",
      lang: searchParams.get("lang") || "",
      sortBy: searchParams.get("sortBy") || "popularity_desc",
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Watchmode API route error:", error);
    return NextResponse.json(
      { results: [], total_pages: 1, error: error.message },
      { status: 500 },
    );
  }
}
