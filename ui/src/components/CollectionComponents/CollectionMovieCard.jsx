"use client";

import Image from "next/image";
import { useEffect, useReducer, useRef, useState } from "react";
import { useAuth } from "@/components/context/AuthContext";
import { useCollectionModal } from "@/components/context/CollectionModalContext";
import { useRouter, useSearchParams } from "next/navigation";
import CustomMovieCreateForm from "@/components/CollectionComponents/CustomMovieCreateForm";

const API_KEY = "3472ccb0d97ebc192cbd0e56bd799736";

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").trim();
}

function getMediaInfo(item, isCustom, isTvmaze, isWatchmode, isAnilist, isOmdb, mediaType) {
  const isTV =
    isTvmaze ||
    mediaType === "tv" ||
    item.mediaType === "tv" ||
    item.type === "series" ||
    (item.first_air_date && !item.release_date);

  const resolvedMediaType = isCustom
    ? item.mediaType || "movie"
    : isTvmaze
      ? "tv"
      : isAnilist
        ? item.mediaType || (item.type === "MANGA" ? "manga" : "tv")
        : isTV
          ? "tv"
          : "movie";

  const rawPoster = item.posterSrc || item.poster_path || item.backdrop_path;
  let posterSrc = "/fallbackImg.png";
  if (rawPoster) {
    if (rawPoster.startsWith("http://") || rawPoster.startsWith("https://")) {
      posterSrc = (isOmdb || rawPoster.includes("media-amazon.com"))
        ? `/api/omdb/image?url=${encodeURIComponent(rawPoster)}`
        : rawPoster;
    } else {
      const cleanPath = rawPoster.startsWith("/") ? rawPoster : `/${rawPoster}`;
      posterSrc = `https://image.tmdb.org/t/p/w500${cleanPath}`;
    }
  }

  return {
    id: item.id || item._id,
    title: item.title || item.name || "Untitled",
    releaseDate: item.release_date || item.first_air_date || (item.year ? `${item.year}` : null),
    posterSrc,
    overview: isTvmaze
      ? (item.overview || stripHtml(item._raw?.summary) || "")
      : (item.overview || ""),
    mediaType: resolvedMediaType,
    rating:
      typeof item.rating === "number"
        ? item.rating
        : typeof item.rating?.average === "number"
          ? item.rating.average
          : typeof item.vote_average === "number"
            ? item.vote_average
            : null,
    averageScore: item.averageScore || null,
    criticScore: item.critic_score || item.criticScore || item._raw?.critic_score || null,
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
    genre: item.genre || (Array.isArray(item.genres) ? item.genres.map(g => g.name || g).join(", ") : null),
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

async function fetchProviders(mediaId, mediaType = "movie", region = "IN", watchOption = "flatrate", provider = "tmdb", item = null) {
  if (!mediaId) return [];
  if (provider === "anilist" || provider === "omdb" || (typeof mediaId === "string" && mediaId.startsWith("tt"))) {
    return item?.streamingLinks || [];
  }

  if (provider === "watchmode") {
    try {
      const res = await fetch(
        `/api/watchmode/title-sources?id=${mediaId}&region=${region}`,
      );
      if (!res.ok) return [];
      const json = await res.json();
      return json || [];
    } catch {
      return [];
    }
  }

  try {
    const type = mediaType === "tv" ? "tv" : "movie";
    const res = await fetch(
      `https://api.themoviedb.org/3/${type}/${mediaId}/watch/providers?api_key=${API_KEY}`,
    );
    if (!res.ok) return [];
    const json = await res.json();
    const regionData = json?.results?.[region];
    return regionData ? regionData[watchOption] || [] : [];
  } catch {
    return [];
  }
}

let globalUserDataCache = null;
let globalUserDataPromise = null;

async function fetchUserData(userId, forceRefresh = false) {
  if (!userId) return { collections: [], watchedList: [] };
  if (!forceRefresh && globalUserDataCache) return globalUserDataCache;
  if (!forceRefresh && globalUserDataPromise) return globalUserDataPromise;

  globalUserDataPromise = (async () => {
    try {
      const [colRes, watchRes] = await Promise.all([
        fetch(`/api/get-collections/${userId}`, { credentials: "include" }),
        fetch(`/api/watch-list/${userId}`, { credentials: "include" }),
      ]);
      const collections = colRes.ok ? (await colRes.json()).collections || [] : [];
      const watchedList = watchRes.ok ? (await watchRes.json()).movies || [] : [];
      globalUserDataCache = { collections, watchedList };
      return globalUserDataCache;
    } catch {
      return { collections: [], watchedList: [] };
    } finally {
      globalUserDataPromise = null;
    }
  })();

  return globalUserDataPromise;
}

function notifyUserDataChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mmc_user_data_updated"));
  }
}

export default function CollectionMovieCard({ movie, collectionId }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasHovered, setHasHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isCustom = movie.isCustom || (typeof movie.storedId === "string" && movie.storedId.startsWith("custom:"));
  const isTvmaze = movie.provider === "tvmaze" || (typeof movie.storedId === "string" && movie.storedId.startsWith("tvmaze:"));
  const isAnilist = movie.provider === "anilist" || (typeof movie.storedId === "string" && movie.storedId.startsWith("anilist:"));
  const isWatchmode = movie.provider === "watchmode" || (typeof movie.storedId === "string" && movie.storedId.startsWith("watchmode:"));
  const isOmdb = movie.provider === "omdb" || (typeof movie.storedId === "string" && (movie.storedId.startsWith("omdb:") || movie.storedId.startsWith("tt")));
  const isManga = isAnilist && (movie.mediaType === "manga" || movie.type === "MANGA");

  const mediaType = isTvmaze ? "tv" : isManga ? "manga" : (movie.mediaType || movie.media_type || (movie.first_air_date && !movie.release_date ? "tv" : "movie"));
  const media = getMediaInfo(movie, isCustom, isTvmaze, isWatchmode, isAnilist, isOmdb, mediaType);
  const rawId = media.id?.toString();
  const compositeId = movie.storedId || (isOmdb ? `omdb:${mediaType}:${rawId}` : isAnilist ? `anilist:${mediaType}:${rawId}` : isWatchmode ? `watchmode:${mediaType}:${rawId}` : isTvmaze ? `tvmaze:tv:${rawId}` : `${mediaType}:${rawId}`);

  const posterSrc = imageError ? "/fallbackImg.png" : media.posterSrc;

  const { user } = useAuth();
  const { openModal } = useCollectionModal();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeRegion = searchParams.has("region")
    ? (searchParams.get("region") || "IN")
    : (user?.region || "IN");
  const activeWatchOption = searchParams.has("watchOption")
    ? (searchParams.get("watchOption") || "flatrate")
    : (user?.watchOption || "flatrate");

  const userIdRef = useRef(user?._id);
  const movieIdRef = useRef(media.id);

  useEffect(() => {
    userIdRef.current = user?._id;
    movieIdRef.current = media.id;
    setImageError(false);
  }, [user?._id, media.id]);

  useEffect(() => {
    if (isCustom || isTvmaze || isOmdb || !media.id || (typeof media.id === "string" && media.id.startsWith("tt"))) {
      dispatch({ type: "SET_PROVIDERS", providers: [] });
      return;
    }

    if (isWatchmode && !hasHovered) {
      return;
    }

    let cancelled = false;
    const currentProvider = isAnilist ? "anilist" : isWatchmode ? "watchmode" : "tmdb";
    fetchProviders(media.id, mediaType, activeRegion, activeWatchOption, currentProvider, movie).then((providers) => {
      if (!cancelled) {
        dispatch({ type: "SET_PROVIDERS", providers });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [media.id, mediaType, activeRegion, activeWatchOption, isCustom, isTvmaze, isAnilist, isOmdb, isWatchmode, hasHovered]);

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
    const currentProvider = isAnilist ? "anilist" : isWatchmode ? "watchmode" : "tmdb";
    const providerPromise = (isCustom || isTvmaze || isOmdb)
      ? Promise.resolve([])
      : fetchProviders(movieIdRef.current, mediaType, activeRegion, activeWatchOption, currentProvider, movie);

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

  const checkIsWatched = () => {
    return (
      state.watchedList.includes(compositeId) ||
      state.watchedList.includes(rawId) ||
      state.watchedList.includes(`movie:${rawId}`) ||
      state.watchedList.includes(`tv:${rawId}`)
    );
  };

  const checkIsAddedToCol = (col) => {
    const list = col.moviesList || [];
    return (
      list.includes(compositeId) ||
      list.includes(rawId) ||
      list.includes(`movie:${rawId}`) ||
      list.includes(`tv:${rawId}`)
    );
  };

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
    const isWatched = checkIsWatched();
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
    const isAdded = checkIsAddedToCol(collection);
    const endpoint = isAdded ? `/api/remove-movie` : `/api/add-movie`;
    if (isAdded && !confirm(`Are you sure you want to remove this ${mediaType === "tv" ? "TV show" : "movie"}?`))
      return;

    const storedMatch = (collection.moviesList || []).find(
      (id) => id === compositeId || id === rawId || id === `movie:${rawId}` || id === `tv:${rawId}`
    );
    const targetMovieId = storedMatch || compositeId;

    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        collectionId: collection._id,
        movieId: targetMovieId,
      }),
    });

    if (res.ok) {
      await fetchUserData(user._id, true);
      notifyUserDataChanged();
      if (isAdded && collection._id === collectionId) {
        router.refresh();
      }
    }
  };

  const isWatched = checkIsWatched();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const getCleanCustomId = () => {
    return (movie._id || movie.id || movie.storedId || rawId || "").toString().replace(/^custom:/, "");
  };

  const handleEditCustomMovie = async (formData) => {
    const cleanId = getCleanCustomId();
    const res = await fetch(`/api/custom-movie/${cleanId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update custom movie.");
    }

    setIsEditOpen(false);
    router.refresh();
  };

  const handleDeleteCustomMovie = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!confirm(`Are you sure you want to permanently delete "${media.title}"?`)) {
      return;
    }

    const cleanId = getCleanCustomId();
    const res = await fetch(`/api/custom-movie/${cleanId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      setIsDeleted(true);
      router.refresh();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to delete movie.");
    }
  };

  if (isDeleted) return null;

  const badgeLabel = isCustom
    ? "Custom"
    : isTvmaze
      ? (media.showType || "TV Series")
      : isWatchmode
        ? (media.showType || (media.mediaType === "tv" ? "TV Series" : "Movie"))
        : isAnilist
          ? (media.showType || (isManga ? "Manga" : "TV Series"))
          : isOmdb
            ? (media.showType || (media.mediaType === "tv" ? "TV Series" : "Movie"))
            : (mediaType === "tv" ? "TV Series" : "Movie");

  const badgeIsTV = !isManga && (isTvmaze || mediaType === "tv" || media.mediaType === "tv");

  return (
    <div
      onMouseEnter={() => {
        if (!hasHovered) setHasHovered(true);
      }}
      className="group relative flex flex-col bg-dark-body2 rounded-xl overflow-hidden border border-white/5 shadow-lg">
      
      {/* Top badges & Custom Controls */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 pointer-events-none flex justify-between items-start">
        {/* Left: Media Type Badge */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-black/40 backdrop-blur-md border border-white/20 text-white/90 shadow-md">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isCustom
                ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                : isManga
                  ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                  : badgeIsTV
                    ? "bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.8)]"
                    : "bg-brand shadow-[0_0_6px_rgba(229,9,20,0.8)]"
            }`}
          />
          {badgeLabel}
        </span>

        {/* Right: Ratings, Badges & Custom controls */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
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

          {/* Custom Edit / Delete Actions */}
          {isCustom && user && (
            <div className="flex items-center gap-1.5 pointer-events-auto z-40">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEditOpen(true);
                }}
                title="Edit Custom Movie"
                className="w-7 h-7 flex justify-center items-center bg-black/40 backdrop-blur-md border border-white/20 rounded-full hover:bg-brand text-white/80 hover:text-white transition-all shadow-md cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="0.85em" height="0.85em" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M5 19h1.425L16.2 9.225L14.775 7.8L5 17.575zm-1 2q-.425 0-.712-.288T3 20v-2.425q0-.4.15-.763t.425-.637L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.437.65T21 6.4q0 .4-.138.763t-.437.662l-12.6 12.6q-.275.275-.638.425t-.762.15zM19 6.4L17.6 5zm-3.525 2.125l-.7-.725L16.2 9.225z"/>
                </svg>
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomMovie}
                title="Delete Custom Movie"
                className="w-7 h-7 flex justify-center items-center bg-black/40 backdrop-blur-md border border-red-500/30 rounded-full hover:bg-red-600 text-red-400 hover:text-white transition-all shadow-md cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="0.85em" height="0.85em" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M7.616 20q-.667 0-1.141-.475T6 18.386V6h-.5q-.213 0-.356-.144T5 5.499t.144-.356T5.5 5H9q0-.31.23-.54t.54-.23h4.46q.31 0 .54.23T15 5h3.5q.213 0 .356.144t.144.357t-.144.356T18.5 6H18v12.385q0 .666-.475 1.14t-1.14.475zM17 6H7v12.385q0 .269.173.442t.443.173h8.769q.269 0 .442-.173t.173-.442zm-6.692 11q.213 0 .357-.144t.143-.356v-8q0-.213-.144-.356T10.307 8t-.356.144t-.143.356v8q0 .213.144.356q.144.144.356.144m3.385 0q.213 0 .356-.144t.143-.356v-8q0-.213-.144-.356Q13.904 8 13.692 8q-.213 0-.357.144t-.143.356v8q0 .213.144.356t.357.144M7 6v13z"/>
                </svg>
              </button>
            </div>
          )}
        </div>
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

      {/* Rich Metadata & Hover Info */}
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
                    const isAdded = checkIsAddedToCol(col);
                    return (
                      <button
                        key={col._id}
                        onClick={() => handleToggleCollection(col)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors hover:bg-white/5 ${
                          isAdded ? "text-yellow-500 font-semibold" : "text-white"
                        }`}>
                        <span className="truncate inline-block max-w-[85%] align-middle">
                          {col.collectionName}
                        </span>
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

      {/* Edit Modal */}
      {isCustom && (
        <CustomMovieCreateForm
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleEditCustomMovie}
          initialData={movie}
          collectionId={collectionId}
        />
      )}
    </div>
  );
}
