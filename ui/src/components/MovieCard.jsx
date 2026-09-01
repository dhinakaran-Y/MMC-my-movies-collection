"use client";

import Image from "next/image";
import { useEffect, useReducer, useRef, useState } from "react";
import { useAuth } from "@/components/context/AuthContext";
import { useCollectionModal } from "@/components/context/CollectionModalContext";
import { useSearchParams } from "next/navigation";
import { stripHtml } from "@/lib/providers/tvmazeAdapter";

// --- State & Reducer ---
const API_KEY = "3472ccb0d97ebc192cbd0e56bd799736";

const initialState = {
  providers: [],
  myCollections: [],
  watchedList: [],
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_ALL":
      return {
        providers: action.providers,
        myCollections: action.collections,
        watchedList: action.watchedList,
      };
    case "SET_PROVIDERS":
      return {
        ...state,
        providers: action.providers,
      };
    case "SET_USER_DATA":
      return {
        ...state,
        myCollections: action.collections,
        watchedList: action.watchedList,
      };
    default:
      return state;
  }
}

// --- Normalize media fields (movie vs TV) ---
function getMediaInfo(item, mediaType, provider = "tmdb") {
  const effectiveProvider = item.provider || (provider === "all" ? "tmdb" : provider);
  const isTvmaze = effectiveProvider === "tvmaze";
  const isWatchmode = effectiveProvider === "watchmode";
  const isAnilist = effectiveProvider === "anilist";
  const isOmdb = effectiveProvider === "omdb";

  const resolvedMediaType = isTvmaze
    ? "tv"
    : isWatchmode
      ? (item.mediaType || item.tmdb_type || (item.type === "movie" ? "movie" : "tv"))
      : isAnilist
        ? (item.mediaType || (item.type === "MANGA" ? "manga" : "tv"))
        : isOmdb
          ? (item.mediaType || (item.type === "series" ? "tv" : "movie"))
          : (item.media_type || (item.first_air_date && !item.release_date ? "tv" : (mediaType || "movie")));
  const isTV = resolvedMediaType === "tv";
  return {
    id: item.id,
    title: isTvmaze || isWatchmode || isAnilist || isOmdb
      ? (item.title || item.name)
      : isTV
        ? (item.name || item.title)
        : (item.title || item.name),
    releaseDate: isTvmaze || isWatchmode || isAnilist || isOmdb
      ? (item.release_date || item.first_air_date || (item.year ? `${item.year}` : null))
      : isTV
        ? item.first_air_date
        : item.release_date,
    posterPath: item.poster_path || item.posterSrc,
    overview: isTvmaze
      ? (item.overview || stripHtml(item._raw?.summary) || "")
      : (item.overview || ""),
    mediaType: resolvedMediaType,
    // Rating & Score
    rating:
      typeof item.rating === "number"
        ? item.rating
        : typeof item.rating?.average === "number"
          ? item.rating.average
          : typeof item.vote_average === "number"
            ? item.vote_average
            : null,
    averageScore: item.averageScore || null,
    criticScore: item.critic_score || item._raw?.critic_score || null,
    showType: item.showType || item.format || null,
    network: item.network || item.studio || null,
    webChannel: item.webChannel || null,
    status: item.status || null,
    episodes: item.episodes || null,
    chapters: item.chapters || null,
    volumes: item.volumes || null,
    streamingLinks: item.streamingLinks || [],
    director: item.director || null,
    writer: item.writer || null,
    actors: item.actors || null,
    genre: item.genre || null,
    runtime: item.runtime || null,
    rated: item.rated || null,
    awards: item.awards || null,
    boxOffice: item.boxOffice || null,
    rottenTomatoes: item.rottenTomatoes || null,
    metacritic: item.metacritic || null,
    imdbRating: item.imdbRating || null,
    imdbVotes: item.imdbVotes || null,
  };
}

const providersCache = new Map();

// --- API Helpers ---
async function fetchProviders(mediaId, mediaType = "movie", region = "IN", watchOption = "flatrate", provider = "tmdb", item = null) {
  if (!mediaId) return [];
  if (provider === "anilist" || provider === "omdb" || (typeof mediaId === "string" && mediaId.startsWith("tt"))) {
    return item?.streamingLinks || [];
  }

  const cacheKey = `${provider}:${mediaType}:${mediaId}:${region}:${watchOption}`;
  if (providersCache.has(cacheKey)) {
    return providersCache.get(cacheKey);
  }

  if (provider === "watchmode") {
    try {
      const res = await fetch(
        `/api/watchmode/title-sources?id=${mediaId}&region=${region}`,
      );
      if (!res.ok) return [];
      const json = await res.json();
      providersCache.set(cacheKey, json || []);
      return json || [];
    } catch {
      return [];
    }
  }

  try {
    const type = mediaType === "tv" ? "tv" : "movie";
    const res = await fetch(
      `/api/tmdb/watch-providers?id=${mediaId}&type=${type}&region=${region}&watchOption=${watchOption}`
    );
    if (!res.ok) return [];
    const json = await res.json();
    const result = json?.providers || [];
    providersCache.set(cacheKey, result);
    return result;
  } catch {
    return [];
  }
}

let globalUserDataCache = { collections: [], watchedList: [] };
let isFetchingUserData = null;

async function fetchUserData(userId, forceRefresh = false) {
  if (!userId) return { collections: [], watchedList: [] };
  if (!forceRefresh && globalUserDataCache.collections.length > 0) {
    return globalUserDataCache;
  }
  if (isFetchingUserData) return isFetchingUserData;

  isFetchingUserData = (async () => {
    try {
      const [colRes, watchRes] = await Promise.all([
        fetch(`/api/get-collections/${userId}`, { credentials: "include" }),
        fetch(`/api/watch-list/${userId}`, { credentials: "include" }),
      ]);
      const data = {
        collections: colRes.ok ? (await colRes.json()).collections || [] : [],
        watchedList: watchRes.ok ? (await watchRes.json()).movies || [] : [],
      };
      globalUserDataCache = data;
      return data;
    } catch {
      return { collections: [], watchedList: [] };
    } finally {
      isFetchingUserData = null;
    }
  })();

  return isFetchingUserData;
}

function notifyUserDataChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mmc_user_data_updated"));
  }
}

// --- Main Component ---
export default function MovieCard({ movie: rawMovie, item, mediaType = "movie", provider = "tmdb" }) {
  const movie = rawMovie || item;
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showDropdown, setShowDropdown] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [hasHovered, setHasHovered] = useState(false);

  const { user } = useAuth();
  const { openModal } = useCollectionModal();
  const searchParams = useSearchParams();
  const isAllProviders = searchParams.get("allProviders") === "true" || provider === "all";
  const effectiveProvider = movie.provider || (provider === "all" ? "tmdb" : provider);
  const isTvmaze = effectiveProvider === "tvmaze";
  const isWatchmode = effectiveProvider === "watchmode";
  const isAnilist = effectiveProvider === "anilist";
  const isOmdb = effectiveProvider === "omdb";

  // Resolve active region & watch option from URL params or user profile
  const activeRegion = searchParams.has("region")
    ? (searchParams.get("region") || (isWatchmode ? "US" : "IN"))
    : (user?.region || (isWatchmode ? "US" : "IN"));
  const activeWatchOption = searchParams.has("watchOption")
    ? (searchParams.get("watchOption") || "flatrate")
    : (user?.watchOption || "flatrate");

  const userIdRef = useRef(user?._id);
  const movieIdRef = useRef(movie?.id);

  // Normalize media fields
  const media = getMediaInfo(movie || {}, mediaType, effectiveProvider);
  // Composite ID for storage: "movie:550", "tv:1396", "tvmaze:tv:169", "watchmode:tv:3257076", "anilist:tv:16498", "omdb:movie:tt1375666"
  const compositeId = movie?.compositeId || (
    isOmdb
      ? `omdb:${media.mediaType}:${media.id}`
      : isAnilist
        ? `anilist:${media.mediaType}:${media.id}`
        : isWatchmode
          ? `watchmode:${media.mediaType}:${media.id}`
          : isTvmaze
            ? `tvmaze:tv:${media.id}`
            : `${media.mediaType}:${media.id}`
  );

  useEffect(() => {
    userIdRef.current = user?._id;
  }, [user?._id]);

  // Reset the error state when the movie changes
  useEffect(() => {
    movieIdRef.current = movie.id;
    setImageError(false);
  }, [movie.id]);

  // 1. Fetch OTT Providers dynamically (for TMDB, on mount; for Watchmode, on hover/demand; for AniList, from normalized streamingLinks)
  useEffect(() => {
    if (isTvmaze || isOmdb || !movie.id || (typeof movie.id === "string" && movie.id.startsWith("tt"))) {
      dispatch({ type: "SET_PROVIDERS", providers: [] });
      return;
    }

    if (isWatchmode && !hasHovered) {
      // Check if already cached
      const cacheKey = `${provider}:${media.mediaType}:${movie.id}:${activeRegion}:${activeWatchOption}`;
      if (providersCache.has(cacheKey)) {
        dispatch({ type: "SET_PROVIDERS", providers: providersCache.get(cacheKey) });
      }
      return;
    }

    let cancelled = false;
    fetchProviders(movie.id, media.mediaType, activeRegion, activeWatchOption, provider, movie).then((providers) => {
      if (!cancelled) {
        dispatch({ type: "SET_PROVIDERS", providers });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [movie.id, media.mediaType, activeRegion, activeWatchOption, isTvmaze, isWatchmode, hasHovered, provider]);

  // 2. Fetch & Synchronize User Data across ALL Movie Cards via custom event
  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;

    const syncUserData = (force = false) => {
      fetchUserData(user._id, force).then((userData) => {
        if (!cancelled) {
          dispatch({
            type: "SET_USER_DATA",
            collections: userData.collections,
            watchedList: userData.watchedList,
          });
        }
      });
    };

    syncUserData(false);

    const handleUpdate = () => {
      syncUserData(true);
    };

    window.addEventListener("mmc_user_data_updated", handleUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("mmc_user_data_updated", handleUpdate);
    };
  }, [user?._id]);

  async function reload() {
    const providerPromise = isTvmaze
      ? Promise.resolve([])
      : fetchProviders(movieIdRef.current, media.mediaType, activeRegion, activeWatchOption, provider);

    const [providers, userData] = await Promise.all([
      providerPromise,
      fetchUserData(userIdRef.current, true),
    ]);
    dispatch({
      type: "SET_ALL",
      providers,
      collections: userData.collections,
      watchedList: userData.watchedList,
    });
    notifyUserDataChanged();
  }

  const handleCollectionSubmit = async (formData) => {
    if (!user?._id) return;
    const res = await fetch(`/api/collection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ownerId: user._id,
        collectionName: formData.collectionName,
        visibility: formData.visibility,
      }),
    });
    if (res.ok) {
      await fetchUserData(user._id, true);
      notifyUserDataChanged();
    }
  };

  const handleToggleWatched = async () => {
    if (!user?._id) return;
    const isWatched = state.watchedList.includes(compositeId) || state.watchedList.includes(movie.id.toString());
    const endpoint = isWatched ? `/api/remove-watched` : `/api/add-watched`;
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ownerId: user._id, movieId: compositeId }),
    });
    if (res.ok) {
      await fetchUserData(user._id, true);
      notifyUserDataChanged();
    }
  };

  const handleToggleCollection = async (collection) => {
    const isAdded = collection.moviesList?.includes(compositeId) || collection.moviesList?.includes(movie.id.toString());
    const endpoint = isAdded ? `/api/remove-movie` : `/api/add-movie`;
    if (isAdded && !confirm(`Are you sure you want to remove this ${mediaType === "tv" ? "TV show" : "movie"}?`))
      return;
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        collectionId: collection._id,
        movieId: compositeId,
      }),
    });
    if (res.ok) {
      await fetchUserData(user._id, true);
      notifyUserDataChanged();
    }
  };

  const isWatched = state.watchedList.includes(compositeId) || state.watchedList.includes(movie.id.toString());

  // Derive posterSrc directly at each render without double slashes
  let posterSrc;
  if (imageError) {
    posterSrc = "/fallbackImg.png";
  } else if (isTvmaze) {
    const raw = movie.posterSrc || movie.poster_path;
    if (raw && (raw.startsWith("http://") || raw.startsWith("https://"))) {
      posterSrc = raw;
    } else if (raw && raw.startsWith("/")) {
      posterSrc = `https://static.tvmaze.com${raw}`;
    } else {
      posterSrc = "/fallbackImg.png";
    }
  } else if (isOmdb) {
    const raw = movie.posterSrc || movie.poster_path;
    if (raw && (raw.startsWith("http://") || raw.startsWith("https://"))) {
      posterSrc = `/api/omdb/image?url=${encodeURIComponent(raw)}`;
    } else {
      posterSrc = "/fallbackImg.png";
    }
  } else if (isAnilist) {
    const raw = movie.posterSrc || movie.poster_path;
    if (raw && (raw.startsWith("http://") || raw.startsWith("https://"))) {
      posterSrc = raw;
    } else {
      posterSrc = "/fallbackImg.png";
    }
  } else {
    const raw = movie.poster_path || movie.posterSrc || movie.backdrop_path;
    if (raw && (raw.startsWith("http://") || raw.startsWith("https://"))) {
      posterSrc = raw.includes("media-amazon.com")
        ? `/api/omdb/image?url=${encodeURIComponent(raw)}`
        : raw;
    } else {
      const cleanPosterPath = raw
        ? raw.startsWith("/")
          ? raw
          : `/${raw}`
        : null;
      posterSrc = cleanPosterPath
        ? `https://image.tmdb.org/t/p/w500${cleanPosterPath}`
        : "/fallbackImg.png";
    }
  }

  // Badge label
  const isManga = isAnilist && (media.mediaType === "manga" || mediaType === "manga");

  const badgeLabel = isTvmaze
    ? (media.showType || "TV Series")
    : isWatchmode
      ? (media.showType || (media.mediaType === "tv" ? "TV Series" : "Movie"))
      : isAnilist
        ? (media.showType || (isManga ? "Manga" : "TV Series"))
        : isOmdb
          ? (media.showType || (media.mediaType === "tv" ? "TV Series" : "Movie"))
          : (mediaType === "tv" ? "TV Series" : "Movie");

  const badgeIsTV = !isManga && (isTvmaze || mediaType === "tv" || media.mediaType === "tv");

  if (!movie || !movie.id) return null;

  return (
    <div
      onMouseEnter={() => {
        if (!hasHovered) setHasHovered(true);
      }}
      className="group relative flex flex-col bg-dark-body2 rounded-xl overflow-hidden border border-white/5 shadow-lg">
      {/* Media Type & Provider Badge */}
      <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none flex flex-col gap-1.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-black/40 backdrop-blur-md border border-white/20 text-white/90 shadow-md">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isManga
                ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                : badgeIsTV
                  ? "bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.8)]"
                  : "bg-brand shadow-[0_0_6px_rgba(229,9,20,0.8)]"
            }`}
          />
          {badgeLabel}
        </span>

        {/* Source Provider Badge (rendered in multi-provider mode or when item explicitly provides it) */}
        {(isAllProviders || movie.provider || provider === "all") && (
          <span
            className={`inline-flex items-center self-start px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider backdrop-blur-md border shadow-md ${
              effectiveProvider === "anilist"
                ? "bg-sky-950/80 border-sky-500/30 text-sky-300"
                : effectiveProvider === "tvmaze"
                  ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-300"
                  : effectiveProvider === "watchmode"
                    ? "bg-indigo-950/80 border-indigo-500/30 text-indigo-300"
                    : effectiveProvider === "omdb"
                      ? "bg-amber-950/80 border-amber-500/30 text-amber-300"
                      : "bg-slate-900/80 border-white/20 text-brand"
            }`}
          >
            {effectiveProvider}
          </span>
        )}
      </div>

      {/* Rating & Critic Score Badges (top right) */}
      <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none flex items-center gap-1.5 flex-wrap justify-end">
        {isOmdb && (media.imdbRating || media.rated) && (
          <div className="flex items-center gap-1">
            {media.rated && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-900/80 border border-white/20 backdrop-blur-md text-white/90 shadow-md">
                {media.rated}
              </span>
            )}
            {media.imdbRating && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 shadow-md">
                ⭐ {media.imdbRating}
              </span>
            )}
          </div>
        )}
        {(isTvmaze || isWatchmode) && typeof media.rating === "number" && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/90 backdrop-blur-md text-black shadow-md">
            ⭐ {media.rating.toFixed ? media.rating.toFixed(1) : media.rating}
          </span>
        )}
        {isWatchmode && typeof media.criticScore === "number" && (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/90 backdrop-blur-md text-black shadow-md">
            🎯 {media.criticScore}%
          </span>
        )}
      </div>

      {/* Image Container */}
      <div className="relative w-full aspect-2/3 h-90 sm:h-100 md:h-110 lg:h-120 overflow-hidden bg-slate-950 flex items-center justify-center">
        {isOmdb || (posterSrc && posterSrc.includes("media-amazon.com")) ? (
          <img
            src={posterSrc}
            alt={media.title}
            referrerPolicy="no-referrer"
            className="object-cover max-sm:object-center w-full h-full"
            onError={() => setImageError(true)}
          />
        ) : (
          <Image
            src={posterSrc}
            alt={media.title}
            className="object-cover max-sm:object-center w-full h-full"
            width={500}
            height={750}
            loading="lazy"
            unoptimized
            onError={() => setImageError(true)}
          />
        )}
      </div>

      <div className="p-4 pt-12 flex flex-col items-center justify-between bg-dark-body2 lg:absolute lg:inset-0 lg:bg-black/90 lg:opacity-0 lg:group-hover:opacity-100 lg:z-10 transition-opacity duration-300 overflow-hidden">
        <div className="w-full flex flex-col items-center my-auto min-h-0">
          <h1 className="w-full px-2 text-orange-500 font-bold text-center text-base lg:text-xl font-mono mb-1.5 capitalize break-words line-clamp-2">
            {media.title}
          </h1>

          {/* OMDb Metadata Subtitle (Year • Runtime • Genre) */}
          {isOmdb && (media.releaseDate || media.runtime || media.genre) && (
            <div className="hidden lg:flex items-center justify-center gap-1.5 text-[10px] text-white/60 font-medium mb-1.5 flex-wrap text-center px-2">
              {media.releaseDate && <span>{media.releaseDate}</span>}
              {media.runtime && <span>• {media.runtime}</span>}
              {media.genre && (
                <span className="text-amber-300/80">• {media.genre.split(",").slice(0, 2).join(",")}</span>
              )}
            </div>
          )}

          <p className="hidden lg:line-clamp-3 text-xs text-white/70 mb-2 text-center w-[92%] leading-relaxed">
            {media.overview}
          </p>

          {/* Multi-Critic Rating Badges (Rotten Tomatoes, Metacritic, IMDb) */}
          {(media.rottenTomatoes || media.metacritic || media.imdbRating) && (
            <div className="hidden lg:flex items-center justify-center gap-1.5 flex-wrap mb-2">
              {media.rottenTomatoes && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/20 border border-red-500/30 text-red-300 shadow-sm">
                  🍅 {media.rottenTomatoes}
                </span>
              )}
              {media.metacritic && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 shadow-sm">
                  🎯 {media.metacritic}
                </span>
              )}
              {media.imdbRating && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 border border-amber-500/30 text-amber-300 shadow-sm">
                  ⭐ {media.imdbRating} {media.imdbVotes ? `(${media.imdbVotes})` : ""}
                </span>
              )}
            </div>
          )}

          {/* Director & Cast (OMDb Rich Details) */}
          {isOmdb && (media.director || media.actors) && (
            <div className="hidden lg:flex flex-col gap-0.5 text-center text-[10px] text-white/70 mb-2 px-2 w-full">
              {media.director && media.director !== "N/A" && (
                <p className="truncate">
                  <span className="text-white/40 font-semibold">Dir:</span> <span className="text-white/90">{media.director}</span>
                </p>
              )}
              {media.actors && media.actors !== "N/A" && (
                <p className="truncate">
                  <span className="text-white/40 font-semibold">Cast:</span> <span className="text-white/80">{media.actors}</span>
                </p>
              )}
            </div>
          )}

          {/* Awards & Box Office (OMDb Rich Details) */}
          {isOmdb && (media.awards || media.boxOffice) && (
            <div className="hidden lg:flex items-center justify-center gap-2 text-[9px] text-white/60 mb-2 px-2 flex-wrap text-center">
              {media.awards && media.awards !== "N/A" && (
                <span className="text-amber-200/90 font-medium truncate max-w-[200px]">
                  🏆 {media.awards}
                </span>
              )}
              {media.boxOffice && media.boxOffice !== "N/A" && (
                <span className="text-emerald-300/90 font-mono">
                  💰 {media.boxOffice}
                </span>
              )}
            </div>
          )}

          {!isOmdb && media.awards && (
            <p className="hidden lg:block text-[10px] font-medium text-amber-200/90 mb-2 text-center px-2 line-clamp-1">
              🏆 {media.awards}
            </p>
          )}

          {/* TVmaze: Network / Channel tag */}
          {isTvmaze && (media.network || media.webChannel) && (
            <div className="hidden lg:flex items-center gap-1.5 mb-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/10 border border-white/10 text-white/60">
                📡 {media.network?.name || media.webChannel?.name}
              </span>
              {media.status && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                  media.status === "Running"
                    ? "bg-green-500/20 border-green-500/30 text-green-300"
                    : media.status === "Ended"
                      ? "bg-red-500/20 border-red-500/30 text-red-300"
                      : "bg-yellow-500/20 border-yellow-500/30 text-yellow-300"
                }`}>
                  {media.status}
                </span>
              )}
            </div>
          )}
        </div>

        {/* OTT Platforms */}
        {state.providers.length > 0 && (
          <div className="text-center mb-3 shrink-0">
            <p className="text-white text-[10px] uppercase tracking-wider mb-1.5">
              Available on:
            </p>
            <div className="flex gap-1.5 justify-center flex-wrap max-h-16 overflow-hidden">
              {state.providers.slice(0, 4).map((p, idx) =>
                p.logo_path ? (
                  <Image
                    key={`ott-${p.provider_id || "p"}-${p.type || ""}-${idx}`}
                    src={`https://media.themoviedb.org/t/p/original${p.logo_path}`}
                    alt={p.provider_name}
                    className="rounded-md border border-white/20 object-cover"
                    width={30}
                    height={30}
                  />
                ) : (
                  <a
                    key={`ott-${p.provider_id || "p"}-${p.type || ""}-${idx}`}
                    href={p.web_url || "#"}
                    target={p.web_url ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-semibold text-cyan-300 transition-colors truncate max-w-28">
                    {p.provider_name}
                  </a>
                ),
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {user && (
          <div className="w-full grid grid-cols-2 gap-2 mt-auto shrink-0 pt-1">
            <button
              onClick={handleToggleWatched}
              className={`${
                isWatched ? "bg-green-600/80 hover:bg-green-600" : "bg-red-600/80 hover:bg-red-600"
              } rounded py-2 text-xs font-semibold text-white transition-colors`}>
              {isWatched ? "Watched ✓" : "Watch"}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full bg-blue-600/80 hover:bg-blue-600 rounded py-2 text-xs font-semibold text-white transition-colors">
                {showDropdown ? "Close" : "+ Collection"}
              </button>

              {showDropdown && (
                <div className="absolute bottom-full mb-2 right-0 w-44 max-h-48 overflow-y-auto bg-dark-body2 border border-white/10 rounded-xl shadow-2xl p-2 z-50">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      openModal(null, handleCollectionSubmit);
                    }}
                    className="w-full text-left px-3 py-2 text-brand font-bold text-xs border-b border-white/10 mb-1 hover:bg-brand/10 rounded transition-colors">
                    + Create New
                  </button>
                  {state.myCollections.map((col) => {
                    const isAdded = col.moviesList?.includes(compositeId) || col.moviesList?.includes(movie.id.toString());
                    return (
                      <button
                        key={col._id}
                        onClick={() => handleToggleCollection(col)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors hover:bg-white/5 ${
                          isAdded
                            ? "text-yellow-500 font-semibold"
                            : "text-white"
                        }`}>
                        <span className="truncate inline-block max-w-[85%] align-middle">{col.collectionName}</span>
                        {isAdded && <span className="float-right">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
