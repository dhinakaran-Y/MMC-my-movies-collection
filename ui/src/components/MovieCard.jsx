"use client";

import Image from "next/image";
import { useEffect, useReducer, useRef, useState } from "react";
import { useAuth } from "@/components/context/AuthContext";
import { useCollectionModal } from "@/components/context/CollectionModalContext";
import { useSearchParams } from "next/navigation";

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
    default:
      return state;
  }
}

// --- Normalize media fields (movie vs TV) ---
function getMediaInfo(item, mediaType) {
  const isTV = mediaType === "tv";
  return {
    id: item.id,
    title: isTV ? (item.name || item.title) : (item.title || item.name),
    releaseDate: isTV ? item.first_air_date : item.release_date,
    posterPath: item.poster_path,
    overview: item.overview,
    mediaType: mediaType || "movie",
  };
}

// --- API Helpers ---
async function fetchProviders(mediaId, mediaType = "movie", region = "IN", watchOption = "flatrate") {
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
export default function MovieCard({ movie, mediaType = "movie" }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showDropdown, setShowDropdown] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { user } = useAuth();
  const { openModal } = useCollectionModal();
  const searchParams = useSearchParams();

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
  const media = getMediaInfo(movie, mediaType);
  // Composite ID for storage: "movie:550" or "tv:1396"
  const compositeId = `${media.mediaType}:${media.id}`;

  useEffect(() => {
    userIdRef.current = user?._id;
  }, [user?._id]);

  // Reset the error state when the movie changes
  useEffect(() => {
    movieIdRef.current = movie.id;
    setImageError(false);
  }, [movie.id]);

  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;
    Promise.all([fetchProviders(movie.id, mediaType, activeRegion, activeWatchOption), fetchUserData(user._id)]).then(
      ([providers, userData]) => {
        if (cancelled) return;
        dispatch({
          type: "SET_ALL",
          providers,
          collections: userData.collections,
          watchedList: userData.watchedList,
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [movie.id, user?._id, mediaType, activeRegion, activeWatchOption]);

  async function reload() {
    const [providers, userData] = await Promise.all([
      fetchProviders(movieIdRef.current, mediaType, activeRegion, activeWatchOption),
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
  const cleanPosterPath = movie.poster_path
    ? movie.poster_path.startsWith("/")
      ? movie.poster_path
      : `/${movie.poster_path}`
    : null;

  const posterSrc = imageError
    ? "/fallbackImg.png"
    : cleanPosterPath
      ? `https://image.tmdb.org/t/p/w500${cleanPosterPath}`
      : "/fallbackImg.png";

  return (
    <div className="group relative flex flex-col bg-dark-body2 rounded-xl overflow-hidden border border-white/5 shadow-lg">
      {/* Media Type Badge */}
      <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-black/40 backdrop-blur-md border border-white/20 text-white/90 shadow-md">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              mediaType === "tv"
                ? "bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.8)]"
                : "bg-brand shadow-[0_0_6px_rgba(229,9,20,0.8)]"
            }`}
          />
          {mediaType === "tv" ? "TV Series" : "Movie"}
        </span>
      </div>

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

      <div className="p-4 pt-14 flex flex-col items-center justify-between bg-dark-body2 lg:absolute lg:inset-0 lg:bg-black/90 lg:opacity-0 lg:group-hover:opacity-100 lg:z-10 transition-opacity duration-300">
        <div className="w-full flex flex-col items-center my-auto">
          <h1 className="w-full px-2 text-orange-500 font-bold text-center text-lg lg:text-2xl font-mono mb-2 capitalize break-words line-clamp-2">
            {media.title}
          </h1>

          <p className="hidden lg:block w-[90%] line-clamp-3 text-xs text-white/70 mb-4 text-center">
            {movie.overview}
          </p>
        </div>

        {/* OTT Platforms */}
        {state.providers.length > 0 && (
          <div className="text-center mb-4">
            <p className="text-white text-[10px] uppercase tracking-wider mb-2">
              Available on:
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              {state.providers.map((p) => (
                <Image
                  key={p.provider_id}
                  src={`https://media.themoviedb.org/t/p/original${p.logo_path}`}
                  alt={p.provider_name}
                  className="rounded-md border border-white/20"
                  width={50}
                  height={50}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {user && (
          <div className="w-full grid grid-cols-2 gap-2 mt-auto">
            <button
              onClick={handleToggleWatched}
              className={`${
                isWatched ? "bg-green-600/80" : "bg-red-600/80"
              } rounded py-2 text-xs font-semibold text-white`}>
              {isWatched ? "Watched ✓" : "Watch"}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full bg-blue-600/80 rounded py-2 text-xs font-semibold text-white">
                {showDropdown ? "Close" : "+ Collection"}
              </button>

              {showDropdown && (
                <div className="absolute bottom-full mb-2 right-0 w-40 bg-dark-body2 border border-white/10 rounded-xl shadow-2xl p-2 z-50">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      openModal(null, handleCollectionSubmit);
                    }}
                    className="w-full text-left px-3 py-2 text-brand font-bold text-xs border-b border-white/10 mb-1">
                    + Create New
                  </button>
                  {state.myCollections.map((col) => {
                    const isAdded = col.moviesList?.includes(compositeId) || col.moviesList?.includes(movie.id.toString());
                    return (
                      <button
                        key={col._id}
                        onClick={() => handleToggleCollection(col)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs ${
                          isAdded
                            ? "text-yellow-500 font-semibold"
                            : "text-white"
                        }`}>
                        {col.collectionName}
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
