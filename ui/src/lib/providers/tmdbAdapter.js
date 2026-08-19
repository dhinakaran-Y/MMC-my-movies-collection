/**
 * TMDB API Adapter
 * Wraps existing TMDB fetch logic into the unified provider interface.
 * This is a thin wrapper — the actual SSR fetch still happens in page.jsx,
 * but this adapter is used for client-side refetches in HomeGrid.
 */

const API_KEY = "3472ccb0d97ebc192cbd0e56bd799736";
const BASE_URL = "https://api.themoviedb.org/3";

/**
 * Normalize a TMDB result item into the unified shape.
 */
export function normalizeMedia(item, mediaType = "movie") {
  const isTV = mediaType === "tv";
  return {
    id: item.id,
    provider: "tmdb",
    mediaType: mediaType,
    compositeId: `${mediaType}:${item.id}`,

    title: isTV ? (item.name || item.title) : (item.title || item.name),
    name: isTV ? (item.name || item.title) : (item.title || item.name),
    overview: item.overview || "",
    poster_path: item.poster_path || null,
    posterSrc: item.poster_path
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : "/fallbackImg.png",

    release_date: isTV ? item.first_air_date : item.release_date,
    first_air_date: item.first_air_date || null,

    vote_average: item.vote_average || null,
    rating: item.vote_average || null,
    popularity: item.popularity || 0,
    genres: [], // TMDB returns genre_ids, not genre names on list items
    genre_ids: item.genre_ids || [],
    language: item.original_language || null,

    // TMDB-specific fields preserved for backward compatibility
    backdrop_path: item.backdrop_path || null,
    vote_count: item.vote_count || 0,
    adult: item.adult || false,

    // Unified fields (not applicable for TMDB list items)
    status: null,
    showType: null,
    network: null,
    webChannel: null,
    episodeCount: undefined,
    seasonCount: undefined,
    runtime: null,
    schedule: null,
    externals: {},
    officialSite: null,

    _raw: item,
  };
}

/**
 * Search media (movies or TV shows).
 */
export async function searchMedia(query, mediaType = "movie", page = 1) {
  if (!query || !query.trim()) return { results: [], total_pages: 1 };

  const searchType = mediaType === "tv" ? "tv" : "movie";
  const url = `${BASE_URL}/search/${searchType}?api_key=${API_KEY}&query=${encodeURIComponent(query.trim())}&page=${page}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return { results: [], total_pages: 1 };
    const data = await res.json();

    const today = new Date().toISOString().split("T")[0];
    let results = (data.results || []).filter((item) => {
      const hasBasicInfo = item.poster_path && item.overview;
      const itemDate = mediaType === "tv" ? item.first_air_date : item.release_date;
      const isReleased = !itemDate || itemDate <= today;
      return hasBasicInfo && isReleased;
    });

    return {
      results: results.map((item) => normalizeMedia(item, mediaType)),
      total_pages: Math.min(data.total_pages || 1, 500),
    };
  } catch (error) {
    console.error("TMDB search error:", error);
    return { results: [], total_pages: 1 };
  }
}

/**
 * Discover/browse media with filters.
 */
export async function browseMedia({
  page = 1,
  mediaType = "movie",
  topRated = false,
  lang = "",
  genre = "",
} = {}) {
  const today = new Date().toISOString().split("T")[0];
  const isTV = mediaType === "tv";
  const officialReleaseTypes = "1|2|3|4|5|6";
  const dateField = isTV ? "first_air_date" : "release_date";
  const discoverType = isTV ? "tv" : "movie";

  let url;

  if (topRated && !lang && !genre) {
    url = `${BASE_URL}/discover/${discoverType}?api_key=${API_KEY}&page=${page}`;
    url += `&sort_by=vote_average.desc&vote_count.gte=${isTV ? 100 : 150}`;
    url += `&${dateField}.lte=${today}`;
    if (!isTV) url += `&with_release_type=${encodeURIComponent(officialReleaseTypes)}`;
  } else {
    url = `${BASE_URL}/discover/${discoverType}?api_key=${API_KEY}&page=${page}`;
    if (genre) url += `&with_genres=${genre}`;
    if (lang) url += `&with_original_language=${lang}`;
    url += `&${dateField}.lte=${today}`;
    if (!isTV) url += `&with_release_type=${encodeURIComponent(officialReleaseTypes)}`;

    if (topRated) {
      const minVotes = lang ? 5 : (isTV ? 100 : 150);
      url += `&sort_by=vote_average.desc&vote_count.gte=${minVotes}`;
    } else if (lang) {
      url += `&sort_by=popularity.desc`;
    } else {
      url += `&sort_by=${dateField}.desc`;
    }
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return { results: [], total_pages: 1 };
    const data = await res.json();

    return {
      results: (data.results || []).map((item) => normalizeMedia(item, mediaType)),
      total_pages: Math.min(data.total_pages || 1, 500),
    };
  } catch (error) {
    console.error("TMDB browse error:", error);
    return { results: [], total_pages: 1 };
  }
}

/**
 * Get genres list for a media type.
 */
export async function getGenres(mediaType = "movie") {
  const genreType = mediaType === "tv" ? "tv" : "movie";
  try {
    const res = await fetch(
      `${BASE_URL}/genre/${genreType}/list?api_key=${API_KEY}`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.genres || [];
  } catch {
    return [];
  }
}

/**
 * Get languages list.
 */
export async function getLanguages() {
  try {
    const res = await fetch(
      `${BASE_URL}/configuration/languages?api_key=${API_KEY}`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.sort((a, b) => a.english_name.localeCompare(b.english_name));
  } catch {
    return [];
  }
}
