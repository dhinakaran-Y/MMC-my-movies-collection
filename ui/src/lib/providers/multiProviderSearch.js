/**
 * Multi-Provider Search Aggregator
 * Asynchronously searches across all supported entertainment providers (TMDB, AniList, TVmaze, Watchmode, OMDb)
 * using Promise.allSettled for maximum fault tolerance.
 */

import { searchMedia as tmdbSearch } from "./tmdbAdapter";
import { searchMedia as anilistSearch } from "./anilistAdapter";
import { getShows as tvmazeGetShows } from "./tvmazeAdapter";
import { searchMedia as watchmodeSearch } from "./watchmodeAdapter";
import { searchMedia as omdbSearch } from "./omdbAdapter";

/**
 * Searches across all providers concurrently and merges results with round-robin interleaving.
 * @param {string} query - Search term
 * @param {Object} options - Optional parameters
 * @returns {Promise<{ results: Array, providerCounts: Object, total_results: number, total_pages: number }>}
 */
export async function searchAllProviders(query, options = {}) {
  const trimmed = query ? query.trim() : "";
  if (!trimmed) {
    return {
      results: [],
      providerCounts: { tmdb: 0, anilist: 0, tvmaze: 0, watchmode: 0, omdb: 0 },
      total_results: 0,
      total_pages: 1,
    };
  }

  // Dispatch all provider searches in parallel
  const [
    tmdbMoviesSettled,
    tmdbTvSettled,
    anilistSettled,
    tvmazeSettled,
    watchmodeSettled,
    omdbSettled,
  ] = await Promise.allSettled([
    tmdbSearch(trimmed, "movie", 1),
    tmdbSearch(trimmed, "tv", 1),
    anilistSearch(trimmed, 1, "ANIME"),
    tvmazeGetShows({ query: trimmed, page: 1 }),
    watchmodeSearch(trimmed, 1),
    omdbSearch({ query: trimmed, page: 1 }),
  ]);

  // Extract results safely
  const tmdbMovies = tmdbMoviesSettled.status === "fulfilled" ? tmdbMoviesSettled.value.results || [] : [];
  const tmdbTv = tmdbTvSettled.status === "fulfilled" ? tmdbTvSettled.value.results || [] : [];
  
  // Combine TMDB movie & tv results, ensuring provider flag is tagged
  const tmdbResults = [...tmdbMovies, ...tmdbTv].map((item) => ({
    ...item,
    provider: "tmdb",
    compositeId: item.compositeId || `tmdb:${item.mediaType || "movie"}:${item.id}`,
  }));

  const anilistResults = (
    anilistSettled.status === "fulfilled" ? anilistSettled.value.results || [] : []
  ).map((item) => ({
    ...item,
    provider: "anilist",
    compositeId: item.compositeId || `anilist:tv:${item.id}`,
  }));

  const tvmazeResults = (
    tvmazeSettled.status === "fulfilled" ? tvmazeSettled.value.results || [] : []
  ).map((item) => ({
    ...item,
    provider: "tvmaze",
    compositeId: item.compositeId || `tvmaze:tv:${item.id}`,
  }));

  const watchmodeResults = (
    watchmodeSettled.status === "fulfilled" ? watchmodeSettled.value.results || [] : []
  ).map((item) => ({
    ...item,
    provider: "watchmode",
    compositeId: item.compositeId || `watchmode:${item.mediaType || "movie"}:${item.id}`,
  }));

  const omdbResults = (
    omdbSettled.status === "fulfilled" ? omdbSettled.value.results || [] : []
  ).map((item) => ({
    ...item,
    provider: "omdb",
    compositeId: item.compositeId || `omdb:${item.mediaType || "movie"}:${item.id || item.imdbID}`,
  }));

  const providerCounts = {
    tmdb: tmdbResults.length,
    anilist: anilistResults.length,
    tvmaze: tvmazeResults.length,
    watchmode: watchmodeResults.length,
    omdb: omdbResults.length,
  };

  // Interleave results using a round-robin algorithm so all providers get fair visibility
  const providerBuckets = [
    { name: "tmdb", items: [...tmdbResults] },
    { name: "anilist", items: [...anilistResults] },
    { name: "tvmaze", items: [...tvmazeResults] },
    { name: "watchmode", items: [...watchmodeResults] },
    { name: "omdb", items: [...omdbResults] },
  ];

  const mergedResults = [];
  const seenIds = new Set();

  let hasMore = true;
  let cycleIndex = 0;

  while (hasMore) {
    hasMore = false;
    for (const bucket of providerBuckets) {
      if (bucket.items.length > cycleIndex) {
        hasMore = true;
        const item = bucket.items[cycleIndex];
        const uniqueKey = `${item.provider}:${item.id || item.compositeId || item.title}`;
        if (!seenIds.has(uniqueKey)) {
          seenIds.add(uniqueKey);
          mergedResults.push(item);
        }
      }
    }
    cycleIndex++;
  }

  return {
    results: mergedResults,
    providerCounts,
    total_results: mergedResults.length,
    total_pages: 1,
  };
}
