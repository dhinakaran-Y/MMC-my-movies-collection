import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY || "3472ccb0d97ebc192cbd0e56bd799736";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type") === "tv" ? "tv" : "movie";
  const region = searchParams.get("region") || "IN";
  const watchOption = searchParams.get("watchOption") || "flatrate";

  if (!id) {
    return NextResponse.json({ providers: [] });
  }

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${type}/${id}/watch/providers?api_key=${TMDB_API_KEY}`,
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) {
      return NextResponse.json({ providers: [] }, { status: 200 });
    }

    const json = await res.json();
    const regionData = json?.results?.[region];
    const providers = regionData ? regionData[watchOption] || [] : [];

    return NextResponse.json({ providers }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ providers: [] }, { status: 200 });
  }
}
