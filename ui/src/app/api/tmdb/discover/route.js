import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/providers/tmdbFetch";

const TMDB_API_KEY = process.env.TMDB_API_KEY || "3472ccb0d97ebc192cbd0e56bd799736";
const BASE_URL = "https://api.themoviedb.org/3";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  const query = searchParams.get("query") || "";
  const lang = searchParams.get("lang") === "all" ? "" : (searchParams.get("lang") || "");
  const genre = searchParams.get("genre") || "";
  const topRated = searchParams.get("topRated") === "true";
  const type = searchParams.get("type") === "tv" ? "tv" : "movie";
  const isTV = type === "tv";

  const today = new Date().toISOString().split("T")[0];
  const officialReleaseTypes = "1|2|3|4|5|6";
  const dateField = isTV ? "first_air_date" : "release_date";
  const searchEndpoint = isTV ? "tv" : "movie";
  const discoverEndpoint = isTV ? "tv" : "movie";

  let url = "";
  if (query) {
    url = `${BASE_URL}/search/${searchEndpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
  } else if (topRated && !lang && !genre) {
    url = `${BASE_URL}/discover/${discoverEndpoint}?api_key=${TMDB_API_KEY}&page=${page}`;
    url += `&sort_by=vote_average.desc&vote_count.gte=${isTV ? 100 : 150}`;
    url += `&${dateField}.lte=${today}`;
    if (!isTV) {
      url += `&with_release_type=${encodeURIComponent(officialReleaseTypes)}`;
    }
  } else {
    url = `${BASE_URL}/discover/${discoverEndpoint}?api_key=${TMDB_API_KEY}&page=${page}`;
    if (genre) url += `&with_genres=${genre}`;
    if (lang) url += `&with_original_language=${lang}`;
    url += `&${dateField}.lte=${today}`;
    if (!isTV) {
      url += `&with_release_type=${encodeURIComponent(officialReleaseTypes)}`;
    }
    if (topRated) {
      const minVotes = lang ? 5 : (isTV ? 100 : 150);
      url += `&sort_by=vote_average.desc&vote_count.gte=${minVotes}`;
    } else {
      url += `&sort_by=popularity.desc`;
    }
  }

  try {
    const res = await tmdbFetch(url);
    if (!res.ok) {
      return NextResponse.json({ results: [], total_pages: 1 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("TMDB discover error:", error);
    return NextResponse.json({ results: [], total_pages: 1 });
  }
}
