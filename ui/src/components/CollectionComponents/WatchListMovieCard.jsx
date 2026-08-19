"use client";

import Image from "next/image";
import { useEffect, useState, useReducer, useRef } from "react";
import { useAuth } from "@/components/context/AuthContext";
import { useCollectionModal } from "@/components/context/CollectionModalContext";
import { useRouter, useSearchParams } from "next/navigation";
import CustomMovieCreateForm from "@/components/CollectionComponents/CustomMovieCreateForm";

const API_KEY = "3472ccb0d97ebc192cbd0e56bd799736";

// --- Reducer ---
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

export default function WatchListMovieCard({ movie }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showDropdown, setShowDropdown] = useState(false);

  const isCustom = movie.isCustom || (typeof movie.storedId === "string" && movie.storedId.startsWith("custom:"));
  const isTvmaze = movie.provider === "tvmaze" || (typeof movie.storedId === "string" && movie.storedId.startsWith("tvmaze:"));
  const mediaType = isTvmaze ? "tv" : (movie.mediaType || movie.media_type || (movie.first_air_date && !movie.release_date ? "tv" : "movie"));
  const mediaTitle = movie.title || movie.name || "Untitled";
  const rawId = movie.id?.toString();
  const compositeId = movie.storedId || (isTvmaze ? `tvmaze:tv:${rawId}` : `${mediaType}:${rawId}`);

  let initialPoster = "/fallbackImg.png";
  if (movie.poster_path) {
    if (movie.poster_path.startsWith("http://") || movie.poster_path.startsWith("https://")) {
      initialPoster = movie.poster_path;
    } else {
      const cleanPath = movie.poster_path.startsWith("/") ? movie.poster_path : `/${movie.poster_path}`;
      initialPoster = `https://image.tmdb.org/t/p/w500${cleanPath}`;
    }
  }

  const [poster, setPoster] = useState(initialPoster);
  const router = useRouter();

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

  useEffect(() => {
    userIdRef.current = user?._id;
  }, [user?._id]);

  useEffect(() => {
    movieIdRef.current = movie.id;
    setPoster(initialPoster);
  }, [movie.id, initialPoster]);

  // 1. Fetch OTT Providers dynamically whenever region, watchOption, or movie changes
  useEffect(() => {
    if (isCustom || isTvmaze || !movie.id) {
      dispatch({ type: "SET_PROVIDERS", providers: [] });
      return;
    }

    let cancelled = false;
    fetchProviders(movie.id, mediaType, activeRegion, activeWatchOption).then((providers) => {
      if (!cancelled) {
        dispatch({ type: "SET_PROVIDERS", providers });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [movie.id, mediaType, activeRegion, activeWatchOption, isCustom, isTvmaze]);

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
    const [providers, userData] = await Promise.all([
      (isCustom || isTvmaze)
        ? Promise.resolve([])
        : fetchProviders(movieIdRef.current, mediaType, activeRegion, activeWatchOption),
      fetchUserData(userIdRef.current),
    ]);
    dispatch({
      type: "SET_ALL",
      providers,
      collections: userData.collections,
      watchedList: userData.watchedList,
    });
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
    if (res.ok) await reload();
  };

  const handleToggleWatched = async () => {
    if (!user?._id) return;
    const isWatched = checkIsWatched();
    const endpoint = isWatched ? `/api/remove-watched` : `/api/add-watched`;

    // Send target ID that was stored or compositeId
    const storedMatch = state.watchedList.find(
      (id) => id === compositeId || id === rawId || id === `movie:${rawId}` || id === `tv:${rawId}`
    );
    const targetMovieId = storedMatch || compositeId;

    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ownerId: user._id, movieId: targetMovieId }),
    });
    if (res.ok) {
      await reload();
      router.refresh();
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

    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        collectionId: collection._id,
        movieId: targetMovieId,
      }),
    });
    await reload();
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

    if (!confirm(`Are you sure you want to permanently delete "${mediaTitle}"?`)) {
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

  return (
    <div className="group relative flex flex-col bg-dark-body2 rounded-xl overflow-hidden border border-white/5 shadow-lg">
      {/* Top badges & Custom Controls */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-30 flex justify-between items-center pointer-events-none">
        {/* Media Type Badge */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-black/40 backdrop-blur-md border border-white/20 text-white/90 shadow-md">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isCustom
                ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                : isTvmaze || mediaType === "tv"
                  ? "bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.8)]"
                  : "bg-brand shadow-[0_0_6px_rgba(229,9,20,0.8)]"
            }`}
          />
          {isCustom ? "Custom" : isTvmaze ? (movie.showType || "TV Series") : mediaType === "tv" ? "TV Series" : "Movie"}
        </span>

        {/* TVmaze Rating Badge */}
        {isTvmaze && typeof movie.rating === "number" && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-yellow-500/90 backdrop-blur-md text-black shadow-md">
            ⭐ {movie.rating.toFixed ? movie.rating.toFixed(1) : movie.rating}
          </span>
        )}

        {/* Custom Edit / Delete Actions */}
        {isCustom && user && (
          <div className="flex items-center gap-2 pointer-events-auto z-40">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsEditOpen(true);
              }}
              title="Edit Custom Movie"
              className="w-8 h-8 flex justify-center items-center bg-black/40 backdrop-blur-md border border-white/20 rounded-full hover:bg-brand text-white/80 hover:text-white transition-all shadow-md cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="0.95em"
                height="0.95em"
                viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M5 19h1.425L16.2 9.225L14.775 7.8L5 17.575zm-1 2q-.425 0-.712-.288T3 20v-2.425q0-.4.15-.763t.425-.637L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.437.65T21 6.4q0 .4-.138.763t-.437.662l-12.6 12.6q-.275.275-.638.425t-.762.15zM19 6.4L17.6 5zm-3.525 2.125l-.7-.725L16.2 9.225z"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleDeleteCustomMovie}
              title="Delete Custom Movie"
              className="w-8 h-8 flex justify-center items-center bg-black/40 backdrop-blur-md border border-red-500/30 rounded-full hover:bg-red-600 text-red-400 hover:text-white transition-all shadow-md cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="0.95em"
                height="0.95em"
                viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M7.616 20q-.667 0-1.141-.475T6 18.386V6h-.5q-.213 0-.356-.144T5 5.499t.144-.356T5.5 5H9q0-.31.23-.54t.54-.23h4.46q.31 0 .54.23T15 5h3.5q.213 0 .356.144t.144.357t-.144.356T18.5 6H18v12.385q0 .666-.475 1.14t-1.14.475zM17 6H7v12.385q0 .269.173.442t.443.173h8.769q.269 0 .442-.173t.173-.442zm-6.692 11q.213 0 .357-.144t.143-.356v-8q0-.213-.144-.356T10.307 8t-.356.144t-.143.356v8q0 .213.144.356q.144.144.356.144m3.385 0q.213 0 .356-.144t.143-.356v-8q0-.213-.144-.356Q13.904 8 13.692 8q-.213 0-.357.144t-.143.356v8q0 .213.144.356t.357.144M7 6v13z"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Image Container */}
      <div className="relative w-full aspect-2/3 h-90 sm:h-100 md:h-110 lg:h-120 overflow-hidden">
        <Image
          src={poster}
          alt={mediaTitle}
          className="object-cover w-full h-full"
          width={500}
          height={750}
          loading="lazy"
          unoptimized
          onError={() => setPoster("/fallbackImg.png")}
        />
      </div>

      {/* Info & Actions Div */}
      <div
        className="p-4 pt-12 flex flex-col items-center justify-between bg-dark-body2 
                      lg:absolute lg:inset-0 lg:bg-black/90 lg:opacity-0 lg:group-hover:opacity-100 lg:z-10 transition-opacity duration-300 overflow-hidden">
        <div className="w-full flex flex-col items-center my-auto min-h-0">
          <h1 className="w-full px-2 text-orange-500 font-bold text-center text-base lg:text-xl font-mono mb-1.5 capitalize break-words line-clamp-2">
            {mediaTitle}
          </h1>

          <p className="hidden lg:line-clamp-3 text-xs text-white/70 mb-2 text-center w-[92%] leading-relaxed">
            {movie.overview}
          </p>
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
              className={`${isWatched ? "bg-green-600/80 hover:bg-green-600" : "bg-red-600/80 hover:bg-red-600"} rounded py-2 text-xs font-semibold text-white transition-colors`}>
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

      {/* Edit Modal */}
      {isCustom && (
        <CustomMovieCreateForm
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleEditCustomMovie}
          initialData={movie}
          isWatchList={true}
        />
      )}
    </div>
  );
}
