import { NextResponse } from "next/server";
import { getShows } from "@/lib/providers/tvmazeAdapter";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const query = searchParams.get("query") || "";
    const genres = searchParams.get("genre")
      ? searchParams.get("genre").split(",").filter(Boolean)
      : [];
    const language = searchParams.get("lang") || "";
    const status = searchParams.get("showStatus") || "";
    const showType = searchParams.get("showType") || "";
    const country = searchParams.get("country") || "";
    const sortBy = searchParams.get("sortBy") || "popularity";

    const data = await getShows({
      page,
      query,
      genres,
      language,
      status,
      showType,
      country,
      sortBy,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("TVmaze API route error:", error);
    return NextResponse.json(
      { results: [], total_pages: 1, error: error.message },
      { status: 500 }
    );
  }
}
