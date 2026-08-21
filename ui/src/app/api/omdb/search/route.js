import { NextResponse } from "next/server";
import { searchMedia, getMediaDetails } from "@/lib/providers/omdbAdapter";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const imdbId = searchParams.get("imdbId") || "";
    const title = searchParams.get("title") || "";
    const type = searchParams.get("type") || "";
    const year = searchParams.get("year") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const plot = searchParams.get("plot") || "full";

    // Direct detail request by IMDb ID or Title
    if (imdbId || title) {
      const details = await getMediaDetails({ imdbId, title, year, plot });
      if (!details) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
      return NextResponse.json({ results: [details], result: details, page: 1, totalPages: 1 });
    }

    // Search request
    const data = await searchMedia({ query, type, year, page });
    return NextResponse.json(data);
  } catch (error) {
    console.error("OMDb API Route Error:", error);
    return NextResponse.json({ error: "Failed to fetch from OMDb API" }, { status: 500 });
  }
}
