/**
 * Watchmode API Adapter
 * Streaming availability, multi-service catalog & granular filtering.
 * https://api.watchmode.com/docs
 */

import watchmodeEnums from "@/data/watchmodeEnums.json";

const API_KEY =
  process.env.WATCHMODE_API_KEY || "GIhw9trw8A06USKolNrMUzjkY38PggsOChr9BMEQ";
const BASE_URL = "https://api.watchmode.com/v1";
const TMDB_API_KEY =
  process.env.TMDB_API_KEY || "3472ccb0d97ebc192cbd0e56bd799736";

// In-memory cache for static API data
let cachedGenres = null;
let cachedSourcesByRegion = {};
const tmdbPosterCache = new Map();

/**
 * Fetch poster_path and overview from TMDB for a given item by tmdb_id & tmdb_type
 */
async function fetchTmdbPoster(tmdbId, tmdbType = "movie") {
  if (!tmdbId) return null;
  const cacheKey = `${tmdbType}:${tmdbId}`;
  if (tmdbPosterCache.has(cacheKey)) {
    return tmdbPosterCache.get(cacheKey);
  }

  const endpoint = tmdbType === "tv" ? "tv" : "movie";
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const info = {
      poster_path: data.poster_path || null,
      backdrop_path: data.backdrop_path || null,
      overview: data.overview || "",
      vote_average: data.vote_average || null,
      vote_count: data.vote_count || 0,
      genres: data.genres || [],
    };
    tmdbPosterCache.set(cacheKey, info);
    return info;
  } catch {
    return null;
  }
}

/**
 * Batch resolve TMDB metadata for a list of Watchmode title items
 */
async function batchEnrichWithTmdb(titles) {
  if (!Array.isArray(titles) || titles.length === 0) return titles;

  const enrichPromises = titles.map(async (item) => {
    const tmdbType = item.tmdb_type || (item.type === "movie" ? "movie" : "tv");
    if (item.tmdb_id) {
      const tmdbData = await fetchTmdbPoster(item.tmdb_id, tmdbType);
      return { ...item, tmdbData };
    }
    return item;
  });

  return await Promise.all(enrichPromises);
}

/**
 * Normalize a Watchmode result item into MMC's unified media shape.
 */
export function normalizeMedia(item) {
  const isTV =
    item.tmdb_type === "tv" ||
    item.type === "tv_series" ||
    item.type === "tv_miniseries" ||
    item.type === "tv_special";
  const resolvedMediaType = isTV ? "tv" : "movie";
  const rawId = item.id;
  const tmdbData = item.tmdbData || {};

  const posterPath =
    item.poster ||
    item.posterMedium ||
    tmdbData.poster_path ||
    null;

  let posterSrc = "/fallbackImg.png";
  if (posterPath) {
    if (posterPath.startsWith("http://") || posterPath.startsWith("https://")) {
      posterSrc = posterPath;
    } else {
      posterSrc = `https://image.tmdb.org/t/p/w500${posterPath.startsWith("/") ? "" : "/"}${posterPath}`;
    }
  }

  const backdropPath =
    item.backdrop ||
    tmdbData.backdrop_path ||
    null;

  return {
    id: rawId,
    watchmodeId: rawId,
    tmdbId: item.tmdb_id || null,
    imdbId: item.imdb_id || null,
    provider: "watchmode",
    mediaType: resolvedMediaType,
    storedId: `watchmode:${resolvedMediaType}:${rawId}`,
    compositeId: `watchmode:${resolvedMediaType}:${rawId}`,

    title: item.title || item.name || "Untitled",
    name: item.title || item.name || "Untitled",
    overview:
      item.plot_overview ||
      tmdbData.overview ||
      `Released in ${item.year || "N/A"} (${item.type?.replace("_", " ") || resolvedMediaType})`,

    poster_path: posterPath,
    posterSrc: posterSrc,
    backdrop_path: backdropPath,

    release_date: item.release_date || (item.year ? `${item.year}-01-01` : null),
    first_air_date: item.release_date || (item.year ? `${item.year}-01-01` : null),
    year: item.year || null,

    vote_average: item.user_rating || tmdbData.vote_average || null,
    rating: item.user_rating || tmdbData.vote_average || null,
    critic_score: item.critic_score || null,
    popularity: item.popularity_percentile || 0,
    genres: item.genre_names || tmdbData.genres || [],
    genre_ids: item.genres || [],
    language: item.original_language || null,

    // Watchmode specific attributes
    showType: item.type ? item.type.replace("_", " ") : null,
    sourceNames: item.network_names || [],
    _raw: item,
  };
}

/**
 * Get all available genres from Watchmode (cached)
 */
export async function getGenres() {
  if (cachedGenres && cachedGenres.length > 0) {
    return cachedGenres;
  }
  try {
    const res = await fetch(`${BASE_URL}/genres/?apiKey=${API_KEY}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error("Failed to fetch genres");
    const data = await res.json();
    cachedGenres = data.map((g) => ({
      id: String(g.id),
      name: g.name,
      tmdb_id: g.tmdb_id,
    }));
    return cachedGenres;
  } catch (error) {
    console.error("Watchmode getGenres error:", error);
    // Fallback static list
    return [
      { id: "1", name: "Action" },
      { id: "2", name: "Adventure" },
      { id: "3", name: "Animation" },
      { id: "4", name: "Comedy" },
      { id: "5", name: "Crime" },
      { id: "6", name: "Documentary" },
      { id: "7", name: "Drama" },
      { id: "8", name: "Family" },
      { id: "9", name: "Fantasy" },
      { id: "10", name: "History" },
      { id: "11", name: "Horror" },
      { id: "12", name: "Music" },
      { id: "13", name: "Mystery" },
      { id: "14", name: "Romance" },
      { id: "15", name: "Science Fiction" },
      { id: "17", name: "Thriller" },
      { id: "18", name: "War" },
      { id: "19", name: "Western" },
    ];
  }
}

/**
 * Get all streaming sources for a region (cached per region)
 */
export async function getSources(region = "", types = "") {
  const cacheKey = `${region}:${types}`;
  if (cachedSourcesByRegion[cacheKey]) {
    return cachedSourcesByRegion[cacheKey];
  }
  try {
    let url = `${BASE_URL}/sources/?apiKey=${API_KEY}`;
    if (region && region !== "all") url += `&regions=${region}`;
    if (types) url += `&types=${types}`;

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error("Failed to fetch sources");
    const data = await res.json();
    cachedSourcesByRegion[cacheKey] = data;
    return data;
  } catch (error) {
    console.error("Watchmode getSources error:", error);
    return (
      watchmodeEnums.allStreamingSources ||
      watchmodeEnums.topStreamingSources ||
      []
    );
  }
}

/**
 * Get streaming sources for a single title
 */
export async function getTitleSources(titleId, region = "") {
  if (!titleId) return [];
  try {
    let url = `${BASE_URL}/title/${titleId}/sources/?apiKey=${API_KEY}`;
    if (region) url += `&regions=${region}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Watchmode getTitleSources error:", error);
    return [];
  }
}

/**
 * Search titles by name
 */
export async function searchMedia(query, page = 1) {
  if (!query || !query.trim()) return { results: [], total_pages: 1 };
  try {
    const url = `${BASE_URL}/search/?apiKey=${API_KEY}&search_field=name&search_value=${encodeURIComponent(
      query.trim(),
    )}`;
    const res = await fetch(url);
    if (!res.ok) return { results: [], total_pages: 1 };
    const data = await res.json();
    const rawTitles = (data.title_results || []).map((t) => ({
      id: t.id,
      title: t.name,
      type: t.type,
      year: t.year,
      imdb_id: t.imdb_id,
      tmdb_id: t.tmdb_id,
      tmdb_type: t.tmdb_type,
    }));

    // Enrich with TMDB poster metadata
    const enriched = await batchEnrichWithTmdb(rawTitles);
    const results = enriched.map(normalizeMedia);

    return {
      results,
      total_pages: 1,
      total_results: results.length,
    };
  } catch (error) {
    console.error("Watchmode search error:", error);
    return { results: [], total_pages: 1 };
  }
}

/**
 * Discover/browse titles with rich filters
 */
export async function browseMedia(params = {}) {
  const page = Number(params.page) || 1;
  const limit = 24;

  const queryParams = new URLSearchParams();
  queryParams.set("apiKey", API_KEY);
  queryParams.set("page", String(page));
  queryParams.set("limit", String(limit));

  // Region (Watchmode plan supports US, IN, CA)
  const SUPPORTED_REGIONS = ["US", "IN", "CA"];
  let region = (params.region || "US").toUpperCase();
  if (!SUPPORTED_REGIONS.includes(region)) {
    region = "US";
  }
  queryParams.set("regions", region);

  // Content Types (movie, tv_series, tv_miniseries, tv_special, short_film)
  const types = params.wmType || params.types || "";
  if (types) queryParams.set("types", types);

  // Service Types (sub, free, rent, buy, tve)
  const serviceTypes = params.serviceTypes || params.source_types || "";
  if (serviceTypes) queryParams.set("source_types", serviceTypes);

  // Streaming Source IDs
  const sourceIds = params.sourceIds || params.source_ids || "";
  if (sourceIds) queryParams.set("source_ids", sourceIds);

  // Genres
  const genres = params.genre || params.genres || "";
  if (genres) queryParams.set("genres", genres);

  // Release Date / Year range
  if (params.yearStart) {
    const start = String(params.yearStart).padEnd(8, "0101");
    queryParams.set("release_date_start", start.substring(0, 8));
  }
  if (params.yearEnd) {
    const end = String(params.yearEnd).padEnd(8, "1231");
    queryParams.set("release_date_end", end.substring(0, 8));
  }

  // User Rating (0-10)
  if (params.ratingLow && Number(params.ratingLow) > 0) {
    queryParams.set("user_rating_low", params.ratingLow);
  }
  if (params.ratingHigh && Number(params.ratingHigh) < 10) {
    queryParams.set("user_rating_high", params.ratingHigh);
  }

  // Critic Score (0-100)
  if (params.criticLow && Number(params.criticLow) > 0) {
    queryParams.set("critic_score_low", params.criticLow);
  }
  if (params.criticHigh && Number(params.criticHigh) < 100) {
    queryParams.set("critic_score_high", params.criticHigh);
  }

  // Languages (2-letter ISO 639 codes)
  const lang = params.lang && params.lang !== "all" ? params.lang : "";
  if (lang) queryParams.set("languages", lang);

  // Sort By
  const sortBy = params.sortBy || params.sort_by || "popularity_desc";
  queryParams.set("sort_by", sortBy);

  const url = `${BASE_URL}/list-titles/?${queryParams.toString()}`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) {
      console.error(`Watchmode list-titles error (${res.status}):`, await res.text());
      return { results: [], total_pages: 1, total_results: 0 };
    }
    const data = await res.json();
    const rawTitles = data.titles || [];

    // Batch enrich with TMDB poster metadata
    const enriched = await batchEnrichWithTmdb(rawTitles);
    const results = enriched.map(normalizeMedia);

    return {
      results,
      total_pages: Math.min(data.total_pages || 1, 500),
      total_results: data.total_results || 0,
      page: data.page || page,
    };
  } catch (error) {
    console.error("Watchmode browse error:", error);
    return { results: [], total_pages: 1, total_results: 0 };
  }
}

export const getContentTypes = () => watchmodeEnums.contentTypes;
export const getServiceTypes = () => watchmodeEnums.serviceTypes;
export const getSortOptions = () => watchmodeEnums.sortOptions;
export const getRegions = () => watchmodeEnums.regions;
export const getTopSources = () => watchmodeEnums.topStreamingSources;

/**
 * Fetch a single title details by Watchmode title ID
 */
export async function getTitleDetails(titleId) {
  if (!titleId) return null;
  try {
    const url = `${BASE_URL}/title/${titleId}/details/?apiKey=${API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const item = await res.json();
    const [enriched] = await batchEnrichWithTmdb([item]);
    return normalizeMedia(enriched);
  } catch (error) {
    console.error("Watchmode getTitleDetails error:", error);
    return null;
  }
}
