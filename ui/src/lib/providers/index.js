/**
 * Provider Factory
 * Central registry that returns the correct adapter based on provider name.
 */

import * as tmdbAdapter from "./tmdbAdapter";
import * as tvmazeAdapter from "./tvmazeAdapter";
import * as watchmodeAdapter from "./watchmodeAdapter";
import * as anilistAdapter from "./anilistAdapter";
import * as omdbAdapter from "./omdbAdapter";

const adapters = {
  tmdb: tmdbAdapter,
  tvmaze: tvmazeAdapter,
  watchmode: watchmodeAdapter,
  anilist: anilistAdapter,
  omdb: omdbAdapter,
};

/**
 * Get the adapter for a given provider.
 * @param {string} providerName - "tmdb" | "tvmaze" | "watchmode" | "anilist" | "omdb"
 * @returns {Object} The adapter module with search/browse/normalize functions
 */
export function getProvider(providerName = "tmdb") {
  const adapter = adapters[providerName?.toLowerCase()];
  if (!adapter) {
    console.warn(`Unknown provider "${providerName}", falling back to TMDB`);
    return adapters.tmdb;
  }
  return adapter;
}

/**
 * List of all supported providers with metadata.
 */
export const PROVIDERS = [
  { id: "tmdb", name: "TMDB", hasMovies: true, hasTV: true, hasServerFilter: true },
  { id: "watchmode", name: "Watchmode", hasMovies: true, hasTV: true, hasServerFilter: true },
  { id: "tvmaze", name: "TVmaze", hasMovies: false, hasTV: true, hasServerFilter: false },
  { id: "anilist", name: "AniList", hasMovies: false, hasTV: true, hasAnime: true, hasManga: true, hasServerFilter: true },
  { id: "omdb", name: "OMDb", hasMovies: true, hasTV: true, hasServerFilter: true },
];

/**
 * Get provider metadata by ID.
 */
export function getProviderMeta(providerName = "tmdb") {
  return PROVIDERS.find((p) => p.id === providerName) || PROVIDERS[0];
}
