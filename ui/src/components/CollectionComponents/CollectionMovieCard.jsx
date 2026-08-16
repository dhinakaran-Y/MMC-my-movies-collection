"use client";

import Image from "next/image";
import { useEffect, useReducer, useRef, useState } from "react";
import { useAuth } from "@/components/context/AuthContext";
import { useCollectionModal } from "@/components/context/CollectionModalContext";
import { useRouter } from "next/navigation";

// --- State & Helpers ---
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

async function fetchMovieData(userId, movieId) {
  try {
    const [provRes, colRes, watchRes] = await Promise.all([
      fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${API_KEY}`,
      ),
      fetch(`/api/get-collections/${userId}`, { credentials: "include" }),
      fetch(`/api/watch-list/${userId}`, { credentials: "include" }),
    ]);

    return {
      providers: provRes.ok
        ? (await provRes.json()).results?.IN?.flatrate || []
        : [],
      collections: colRes.ok ? (await colRes.json()).collections || [] : [],
      watchedList: watchRes.ok ? (await watchRes.json()).movies || [] : [],
    };
  } catch {
    return { collections: [], watchedList: [], providers: [] };
  }
}

export default function CollectionMovieCard({ movie, collectionId }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showDropdown, setShowDropdown] = useState(false);
  const cleanPosterPath = movie.poster_path
    ? movie.poster_path.startsWith("/")
      ? movie.poster_path
      : `/${movie.poster_path}`
    : null;

  const initialPoster = cleanPosterPath
    ? `https://image.tmdb.org/t/p/w500${cleanPosterPath}`
    : "/fallbackImg.png";

  const [poster, setPoster] = useState(initialPoster);

  const { user } = useAuth();
  const { openModal } = useCollectionModal();
  const router = useRouter();

  const userIdRef = useRef(user?._id);
  const movieIdRef = useRef(movie.id);

  useEffect(() => {
    userIdRef.current = user?._id;
    movieIdRef.current = movie.id;
    setPoster(initialPoster);
  }, [user?._id, movie.id, initialPoster]);

  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;
    fetchMovieData(user._id, movie.id).then((data) => {
      if (cancelled) return;
      dispatch({ type: "SET_ALL", ...data });
    });
    return () => {
      cancelled = true;
    };
  }, [movie.id, user?._id]);

  async function reload() {
    const data = await fetchMovieData(userIdRef.current, movieIdRef.current);
    dispatch({ type: "SET_ALL", ...data });
  }

  const handleToggleWatched = async () => {
    if (!user?._id) return;
    const isWatched = state.watchedList.includes(movie.id.toString());
    const endpoint = isWatched ? `/api/remove-watched` : `/api/add-watched`;
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ownerId: user._id, movieId: movie.id.toString() }),
    });
    await reload();
  };

  const handleToggleCollection = async (collection) => {
    const isAdded = collection.moviesList?.includes(movie.id.toString());
    const endpoint = isAdded ? `/api/remove-movie` : `/api/add-movie`;
    if (isAdded && !confirm("Are you sure you want to remove this movie?"))
      return;

    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        collectionId: collection._id,
        movieId: movie.id.toString(),
      }),
    });

    if (res.ok && isAdded && collection._id === collectionId) {
      router.refresh();
      return;
    }
    await reload();
  };

  const isWatched = state.watchedList.includes(movie.id.toString());

  return (
    <div className="group relative flex flex-col bg-dark-body2 rounded-xl overflow-hidden border border-white/5 shadow-lg">
      {/* Image Container */}
      <div className="relative w-full aspect-2/3 h-90 sm:h-100 md:h-110 lg:h-120 overflow-hidden">
        <Image
          src={poster}
          alt={movie.title}
          className="object-cover w-full h-full"
          width={500}
          height={750}
          loading="lazy"
          unoptimized
          onError={() => setPoster("/fallbackImg.png")}
        />
      </div>

      {/* Info & Actions Div 
          - Mobile/Tablet: Natural flow (below image)
          - LG+: Absolute hover-overlay
      */}
      <div
        className="p-4 flex flex-col items-center justify-center bg-dark-body2 
                      lg:absolute lg:inset-0 lg:bg-black/90 lg:opacity-0 lg:group-hover:opacity-100 lg:z-10 transition-opacity duration-300">
        <h1 className="text-orange-500 font-bold text-center text-lg lg:text-2xl font-mono mb-2">
          {movie.title}
        </h1>

        <p className="hidden lg:block w-[90%] line-clamp-3 text-xs text-white/70 mb-4 text-center">
          {movie.overview}
        </p>

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
                  width={25}
                  height={25}
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
              className={`${isWatched ? "bg-green-600/80" : "bg-red-600/80"} rounded py-2 text-xs font-semibold text-white`}>
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
                      openModal(null, (formData) => {
                        /* handle submit */
                      });
                    }}
                    className="w-full text-left px-3 py-2 text-brand font-bold text-xs border-b border-white/10 mb-1">
                    + Create New
                  </button>
                  {state.myCollections.map((col) => {
                    const isAdded = col.moviesList?.includes(
                      movie.id.toString(),
                    );
                    return (
                      <button
                        key={col._id}
                        onClick={() => handleToggleCollection(col)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs ${isAdded ? "text-yellow-500 font-semibold" : "text-white"}`}>
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
