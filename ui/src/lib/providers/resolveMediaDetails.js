import { getMediaById as anilistGetById } from "./anilistAdapter.js";
import { getTitleDetails as watchmodeGetById } from "./watchmodeAdapter.js";
import { getMediaDetails as omdbGetById } from "./omdbAdapter.js";
import { tmdbFetch } from "./tmdbFetch.js";

const TMDB_API_KEY = process.env.TMDB_API_KEY || "3472ccb0d97ebc192cbd0e56bd799736";
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:5000";

function getApiUrl(subpath) {
  const cleanPath = subpath.startsWith("/api/")
    ? subpath.replace(/^\/api/, "")
    : subpath.startsWith("/")
      ? subpath
      : `/${subpath}`;
  const base = BACKEND_URL.replace(/\/$/, "");
  return base.endsWith("/api") ? `${base}${cleanPath}` : `${base}${cleanPath}`;
}

/**
 * Helper to retry async operations with exponential backoff.
 * Automatically retries on transient 5xx server errors, rate-limiting (429), or network dropouts.
 * Fast-fails immediately on 4xx client errors (e.g. 404, 401, 403) so no time is wasted.
 */
async function fetchWithRetry(fn, maxRetries = 3, delayMs = 600, label = "request") {
  let lastResult = null;
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fn();

      // If response has HTTP status code
      if (res && typeof res.status === "number") {
        if (res.ok) {
          if (attempt > 0) {
            console.log(
              `[Auto-Retry] [${label}] Recovered successfully on retry ${attempt} of ${maxRetries}!`
            );
          }
          return res;
        }
        lastResult = res;

        // Only retry if it's a 5xx server error or 429 rate limit
        const isRetryable = res.status >= 500 || res.status === 429;
        if (!isRetryable) {
          return res; // Fast-fail on 404, 401, 403, etc.
        }
      } else {
        // Data object, null, or non-response value
        if (attempt > 0 && res) {
          console.log(
            `[Auto-Retry] [${label}] Recovered successfully on retry ${attempt} of ${maxRetries}!`
          );
        }
        return res;
      }
    } catch (err) {
      lastError = err;
    }

    const errStatus = lastResult?.status ? `HTTP ${lastResult.status}` : lastError?.message || "Error";

    if (attempt < maxRetries) {
      const retryCount = attempt + 1;
      const waitTime = Math.round(delayMs * Math.pow(1.5, attempt));
      console.warn(
        `[Auto-Retry] [${label}] Request failed (${errStatus}). Initiating retry ${retryCount} of ${maxRetries} in ${waitTime}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    } else {
      console.error(
        `[Auto-Retry] [${label}] All ${maxRetries} retries failed (Final reason: ${errStatus}). Serving fallback media item.`
      );
    }
  }

  if (lastResult !== null) return lastResult;
  throw lastError || new Error("Request failed after retries");
}

/**
 * Resilient fallback generator when an upstream provider (AniList, TMDB, etc.)
 * is offline, rate-limited, or disabled. Ensures collections never drop items.
 */
export function createFallbackMedia(storedId, reason = "Upstream Service Unavailable") {
  if (!storedId) return null;

  let provider = "unknown";
  let id = storedId;
  let mediaType = "movie";
  let title = "Media Item";

  if (storedId.startsWith("custom:")) {
    provider = "custom";
    id = storedId.replace(/^custom:/, "");
    title = `Custom Movie (${id.slice(-6)})`;
  } else if (storedId.startsWith("anilist:")) {
    provider = "anilist";
    const parts = storedId.split(":");
    id = parts[2] || parts[1];
    mediaType = parts[1] === "manga" ? "manga" : "tv";
    title = `AniList ${mediaType === "manga" ? "Manga" : "Anime"} #${id}`;
  } else if (storedId.startsWith("tvmaze:")) {
    provider = "tvmaze";
    const parts = storedId.split(":");
    id = parts[2] || parts[1];
    mediaType = "tv";
    title = `TVmaze Show #${id}`;
  } else if (storedId.startsWith("omdb:") || storedId.startsWith("tt")) {
    provider = "omdb";
    const imdbId = storedId.startsWith("omdb:")
      ? storedId.split(":")[storedId.split(":").length - 1]
      : storedId;
    id = imdbId;
    title = `IMDb #${id}`;
  } else if (storedId.startsWith("watchmode:")) {
    provider = "watchmode";
    const parts = storedId.split(":");
    id = parts[2] || parts[1];
    title = `WatchMode Title #${id}`;
  } else {
    provider = "tmdb";
    if (storedId.includes(":")) {
      const parts = storedId.split(":");
      mediaType = parts[0];
      id = parts[1];
    }
    title = `TMDB ${mediaType === "tv" ? "Show" : "Movie"} #${id}`;
  }

  return {
    id,
    storedId,
    title,
    name: title,
    poster_path: null,
    posterSrc: "/fallbackImg.png",
    overview: `Details are temporarily unavailable from ${provider.toUpperCase()} (${reason}). Your item is safely stored in this collection and will reload once the provider restores service.`,
    mediaType,
    provider,
    isFallback: true,
    isUnavailable: true,
  };
}

export async function resolveMediaDetails(storedId) {
  if (!storedId) return null;

  try {
    // 1. Custom Movie: "custom:60a8b..."
    if (storedId.startsWith("custom:")) {
      const id = storedId.replace(/^custom:/, "");
      try {
        const res = await fetchWithRetry(
          () => fetch(getApiUrl(`/custom-movie/${id}`), { cache: "no-store" }),
          3,
          500,
          `Custom Movie ${id}`
        );
        if (!res.ok) return createFallbackMedia(storedId, "Custom movie not found");
        const data = await res.json();
        const custom = data.data;
        if (!custom) return createFallbackMedia(storedId, "Custom movie not found");
        return {
          id: custom._id,
          storedId: `custom:${custom._id}`,
          title: custom.title,
          poster_path: custom.poster_path,
          posterSrc: custom.poster_path || "/fallbackImg.png",
          overview: custom.overview,
          mediaType: custom.mediaType || "movie",
          isCustom: true,
        };
      } catch (err) {
        return createFallbackMedia(storedId, err.message);
      }
    }

    // 2. TVmaze: "tvmaze:tv:169" or "tvmaze:169"
    if (storedId.startsWith("tvmaze:")) {
      const parts = storedId.split(":");
      const id = parts[2] || parts[1];
      try {
        const res = await fetchWithRetry(
          () => fetch(`https://api.tvmaze.com/shows/${id}`, { next: { revalidate: 86400 } }),
          3,
          500,
          `TVmaze Show ${id}`
        );
        if (!res.ok) return createFallbackMedia(storedId, `TVmaze HTTP ${res.status}`);
        const show = await res.json();
        const summaryClean = show.summary
          ? show.summary.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
          : "";
        return {
          id: show.id,
          storedId: `tvmaze:tv:${show.id}`,
          title: show.name,
          name: show.name,
          poster_path: show.image?.medium || show.image?.original || null,
          posterSrc: show.image?.medium || show.image?.original || "/fallbackImg.png",
          overview: summaryClean,
          mediaType: "tv",
          provider: "tvmaze",
          rating: show.rating?.average || null,
          showType: show.type || null,
          first_air_date: show.premiered || null,
        };
      } catch (err) {
        return createFallbackMedia(storedId, err.message);
      }
    }

    // 3. AniList: "anilist:tv:16498", "anilist:manga:30013", "anilist:anime:16498", "anilist:16498"
    if (storedId.startsWith("anilist:")) {
      const parts = storedId.split(":");
      const id = parts[2] || parts[1];
      try {
        const item = await anilistGetById(id);
        if (!item) return createFallbackMedia(storedId, "AniList API temporarily disabled");
        return {
          ...item,
          storedId,
          provider: "anilist",
        };
      } catch (err) {
        return createFallbackMedia(storedId, err.message);
      }
    }

    // 4. Watchmode: "watchmode:movie:3173903", "watchmode:tv:3257076", "watchmode:3173903"
    if (storedId.startsWith("watchmode:")) {
      const parts = storedId.split(":");
      const id = parts[2] || parts[1];
      try {
        const item = await watchmodeGetById(id);
        if (!item) return createFallbackMedia(storedId, "Watchmode unavailable");
        return {
          ...item,
          storedId,
          provider: "watchmode",
        };
      } catch (err) {
        return createFallbackMedia(storedId, err.message);
      }
    }

    // 5. OMDb: "omdb:movie:tt1375666", "omdb:tv:tt0903747", "omdb:tt1375666", or bare "tt1375666"
    if (storedId.startsWith("omdb:") || storedId.startsWith("tt")) {
      const imdbId = storedId.startsWith("omdb:")
        ? storedId.split(":")[storedId.split(":").length - 1]
        : storedId;
      try {
        const item = await omdbGetById({ imdbId });
        if (!item) return createFallbackMedia(storedId, "OMDb unavailable");
        return {
          ...item,
          storedId: `omdb:${item.mediaType || "movie"}:${item.id}`,
          provider: "omdb",
        };
      } catch (err) {
        return createFallbackMedia(storedId, err.message);
      }
    }

    // 6. TMDB Movie / TV: "movie:550", "tv:1396", or bare numeric "550"
    let type = "movie";
    let id = storedId;
    if (storedId.includes(":")) {
      [type, id] = storedId.split(":");
    }
    try {
      const res = await fetchWithRetry(
        () =>
          tmdbFetch(
            `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}`,
            { next: { revalidate: 86400 } },
          ),
        3,
        600,
        `TMDB ${type} #${id}`
      );
      if (!res.ok) return createFallbackMedia(storedId, `TMDB HTTP ${res.status}`);
      const data = await res.json();
      return {
        ...data,
        mediaType: type,
        storedId: `${type}:${id}`,
        provider: "tmdb",
      };
    } catch (err) {
      return createFallbackMedia(storedId, err.message);
    }
  } catch (error) {
    console.warn("[resolveMediaDetails] error for", storedId, error.message || error);
    return createFallbackMedia(storedId, error.message);
  }
}
