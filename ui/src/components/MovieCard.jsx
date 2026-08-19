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
  const isTvmaze = provider === "tvmaze";
  const resolvedMediaType = isTvmaze
    ? "tv"
    : (item.media_type || (item.first_air_date && !item.release_date ? "tv" : (mediaType || "movie")));
  const isTV = resolvedMediaType === "tv";
  return {
    id: item.id,
    title: isTvmaze
      ? (item.title || item.name)
      : isTV
        ? (item.name || item.title)
        : (item.title || item.name),
    releaseDate: isTvmaze
      ? (item.first_air_date || item.release_date)
      : isTV
        ? item.first_air_date
        : item.release_date,
    posterPath: item.poster_path,
    overview: isTvmaze
      ? (item.overview || stripHtml(item._raw?.summary) || "")
      : (item.overview || ""),
    mediaType: resolvedMediaType,
    // TVmaze extra info
    rating:
      typeof item.rating === "number"
        ? item.rating
        : typeof item.rating?.average === "number"
          ? item.rating.average
          : typeof item.vote_average === "number"
            ? item.vote_average
            : null,
    showType: item.showType || null,
    network: item.network || null,
    webChannel: item.webChannel || null,
    status: item.status || null,
  };
}

// --- API Helpers ---
async function fetchProviders(mediaId, mediaType = "movie", region = "IN", watchOption = "flatrate") {
  if (!mediaId) return [];
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

async function fetchUserData(userId) {
  if (!userId) return { collections: [], watchedList: [] };
  try {
    const [colRes, watchRes] = await Promise.all([
      fetch(`/api/get-collections/${userId}`, { credentials: "include" }),
      fetch(`/api/watch-list/${userId}`, { credentials: "include" }),
    ]);
    return {
      collections: colRes.ok ? (await colRes.json()).collections || [] : [],
      watchedList: watchRes.ok ? (await watchRes.json()).movies || [] : [],
    };
  } catch {
    return { collections: [], watchedList: [] };
  }
}

// --- Main Component ---
export default function MovieCard({ movie, mediaType = "movie", provider = "tmdb" }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showDropdown, setShowDropdown] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { user } = useAuth();
  const { openModal } = useCollectionModal();
  const searchParams = useSearchParams();

  const isTvmaze = provider === "tvmaze";

  // Resolve active region & watch option from URL params or user profile
  const activeRegion = searchParams.has("region")
    ? (searchParams.get("region") || "IN")
    : (user?.region || "IN");
  const activeWatchOption = searchParams.has("watchOption")
    ? (searchParams.get("watchOption") || "flatrate")
    : (user?.watchOption || "flatrate");

  const userIdRef = useRef(user?._id);
  const movieIdRef = useRef(movie.id);

  // Normalize media fields
  const media = getMediaInfo(movie, mediaType, provider);
  // Composite ID for storage: "movie:550", "tv:1396", or "tvmaze:tv:169"
  const compositeId = isTvmaze
    ? `tvmaze:tv:${media.id}`
    : `${media.mediaType}:${media.id}`;

  useEffect(() => {
    userIdRef.current = user?._id;
  }, [user?._id]);

  // Reset the error state when the movie changes
  useEffect(() => {
    movieIdRef.current = movie.id;
    setImageError(false);
  }, [movie.id]);

  // 1. Fetch OTT Providers dynamically whenever region, watchOption, or movie changes
  useEffect(() => {
    if (isTvmaze || !movie.id) {
      dispatch({ type: "SET_PROVIDERS", providers: [] });
      return;
    }

    let cancelled = false;
    fetchProviders(movie.id, media.mediaType, activeRegion, activeWatchOption).then((providers) => {
      if (!cancelled) {
        dispatch({ type: "SET_PROVIDERS", providers });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [movie.id, media.mediaType, activeRegion, activeWatchOption, isTvmaze]);

  // 2. Fetch User Data (collections & watchedList)
  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;

    fetchUserData(user._id).then((userData) => {
      if (!cancelled) {
        dispatch({
          type: "SET_USER_DATA",
          collections: userData.collections,
          watchedList: userData.watchedList,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user?._id]);

  async function reload() {
    const providerPromise = isTvmaze
      ? Promise.resolve([])
      : fetchProviders(movieIdRef.current, media.mediaType, activeRegion, activeWatchOption);

    const [providers, userData] = await Promise.all([
      providerPromise,
      fetchUserData(userIdRef.current),
    ]);
    dispatch({
      type: "SET_ALL",
      providers,
      collections: userData.collections,
      watchedList: userData.watchedList,
    });
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
    if (res.ok) await reload();
  };

  const handleToggleWatched = async () => {
    if (!user?._id) return;
    const isWatched = state.watchedList.includes(compositeId) || state.watchedList.includes(movie.id.toString());
    const endpoint = isWatched ? `/api/remove-watched` : `/api/add-watched`;
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ownerId: user._id, movieId: compositeId }),
    });
    await reload();
  };

  const handleToggleCollection = async (collection) => {
    const isAdded = collection.moviesList?.includes(compositeId) || collection.moviesList?.includes(movie.id.toString());
    const endpoint = isAdded ? `/api/remove-movie` : `/api/add-movie`;
    if (isAdded && !confirm(`Are you sure you want to remove this ${mediaType === "tv" ? "TV show" : "movie"}?`))
      return;
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        collectionId: collection._id,
        movieId: compositeId,
      }),
    });
    await reload();
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
  } else {
    const raw = movie.poster_path || movie.posterSrc;
    if (raw && (raw.startsWith("http://") || raw.startsWith("https://"))) {
      posterSrc = raw;
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

  // Badge label: TVmaze shows the specific show type (Scripted, Animation, etc.)
  const badgeLabel = isTvmaze
    ? (media.showType || "TV Series")
    : (mediaType === "tv" ? "TV Series" : "Movie");

  const badgeIsTV = isTvmaze || mediaType === "tv";

  return (
    <div className="group relative flex flex-col bg-dark-body2 rounded-xl overflow-hidden border border-white/5 shadow-lg">
      {/* Media Type Badge */}
      <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none flex flex-col gap-1.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-black/40 backdrop-blur-md border border-white/20 text-white/90 shadow-md">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              badgeIsTV
                ? "bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.8)]"
                : "bg-brand shadow-[0_0_6px_rgba(229,9,20,0.8)]"
            }`}
          />
          {badgeLabel}
        </span>
      </div>

      {/* TVmaze Rating Badge (top right) */}
      {isTvmaze && typeof media.rating === "number" && (
        <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-yellow-500/90 backdrop-blur-md text-black shadow-md">
            ⭐ {media.rating.toFixed ? media.rating.toFixed(1) : media.rating}
          </span>
        </div>
      )}

      {/* Image Container */}
      <div className="relative w-full aspect-2/3 h-90 sm:h-100 md:h-110 lg:h-120 overflow-hidden">
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
      </div>

      <div className="p-4 pt-12 flex flex-col items-center justify-between bg-dark-body2 lg:absolute lg:inset-0 lg:bg-black/90 lg:opacity-0 lg:group-hover:opacity-100 lg:z-10 transition-opacity duration-300 overflow-hidden">
        <div className="w-full flex flex-col items-center my-auto min-h-0">
          <h1 className="w-full px-2 text-orange-500 font-bold text-center text-base lg:text-xl font-mono mb-1.5 capitalize break-words line-clamp-2">
            {media.title}
          </h1>

          <p className="hidden lg:line-clamp-3 text-xs text-white/70 mb-2 text-center w-[92%] leading-relaxed">
            {media.overview}
          </p>

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
              {state.providers.slice(0, 4).map((p) => (
                <Image
                  key={p.provider_id}
                  src={`https://media.themoviedb.org/t/p/original${p.logo_path}`}
                  alt={p.provider_name}
                  className="rounded-md border border-white/20 object-cover"
                  width={30}
                  height={30}
                />
              ))}
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
