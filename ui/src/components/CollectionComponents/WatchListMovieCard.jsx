"use client";

import Image from "next/image";
import { useEffect, useState, useReducer, useRef } from "react";
import { useAuth } from "@/components/context/AuthContext";
import { useCollectionModal } from "@/components/context/CollectionModalContext";
import { useRouter } from "next/navigation";

const API_KEY = "3472ccb0d97ebc192cbd0e56bd799736";

// --- Reducer (single dispatch, compiler-safe) ---
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

// --- Pure fetcher outside component ---
async function fetchMovieData(userId, movieId) {
  const [provRes, colRes, watchRes] = await Promise.all([
    fetch(
      `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${API_KEY}`,
    ),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/get-collections/${userId}`, { credentials: "include" }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/watch-list/${userId}`, { credentials: "include" }),
  ]);

  return {
    providers: provRes.ok
      ? (await provRes.json()).results?.IN?.flatrate || []
      : [],
    collections: colRes.ok ? (await colRes.json()).collections || [] : [],
    watchedList: watchRes.ok ? (await watchRes.json()).movies || [] : [],
  };
}

export default function WatchListMovieCard({ movie }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  const { user } = useAuth();
  const { openModal } = useCollectionModal();

  // Stable ref to always have latest userId/movieId in handlers
  const userIdRef = useRef(user?._id);
  const movieIdRef = useRef(movie.id);
  useEffect(() => {
    userIdRef.current = user?._id;
  }, [user?._id]);
  useEffect(() => {
    movieIdRef.current = movie.id;
  }, [movie.id]);

  // Effect is self-contained: dispatch is stable, never triggers warning
  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;

    fetchMovieData(user._id, movie.id)
      .then((data) => {
        if (cancelled) return;
        dispatch({
          type: "SET_ALL",
          providers: data.providers,
          collections: data.collections,
          watchedList: data.watchedList,
        });
      })
      .catch((err) => console.error("Data load error:", err));

    return () => {
      cancelled = true;
    };
  }, [movie.id, user?._id]);

  // Standalone reload for event handlers only — never called from an effect
  async function reload() {
    const userId = userIdRef.current;
    const movieId = movieIdRef.current;
    if (!userId) return;

    const data = await fetchMovieData(userId, movieId);
    dispatch({
      type: "SET_ALL",
      providers: data.providers,
      collections: data.collections,
      watchedList: data.watchedList,
    });
  }

  const handleCollectionSubmit = async (formData) => {
    if (!user?._id) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collection`, {
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
    const movieIdStr = movie.id.toString();
    const isWatched = state.watchedList.includes(movieIdStr);
    const endpoint = isWatched
      ? `${process.env.NEXT_PUBLIC_API_URL}/remove-watched`
      : `${process.env.NEXT_PUBLIC_API_URL}/add-watched`;

    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ownerId: user._id, movieId: movieIdStr }),
    });
    if (res.ok) {
      await reload();
      router.refresh();
    }
  };

  const handleToggleCollection = async (collection) => {
    const movieIdStr = movie.id.toString();
    const isAdded = collection.moviesList?.includes(movieIdStr);
    const endpoint = isAdded
      ? `${process.env.NEXT_PUBLIC_API_URL}/remove-movie`
      : `${process.env.NEXT_PUBLIC_API_URL}/add-movie`;

    if (isAdded && !confirm("Are you ok to remove the movie?")) return;

    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        collectionId: collection._id,
        movieId: movieIdStr,
      }),
    });
    await reload();
  };

  const isWatched = state.watchedList.includes(movie.id.toString());

  return (
    <div className="brightness-70 relative group overflow-hidden rounded-xl">
      <Image
        src={`https://media.themoviedb.org/t/p/w600_and_h900_face/${movie.poster_path}`}
        alt={movie.title}
        className="h-full object-center brightness-75 object-cover w-full"
        width={500}
        height={750}
        loading="lazy"
      />
      <div className="absolute flex-col space-y-3 text-white/90 font-semibold bg-black/80 top-0 right-0 left-0 bottom-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300 p-4">
        <h1 className="text-orange-600/70 capitalize font-semibold text-center text-3xl font-mono">
          {movie.title}
        </h1>
        <p className="w-[90%] line-clamp-3">{movie.overview}</p>

        {/* OTT Platforms */}
        <div className="p-5 text-center">
          {state.providers.length > 0 && (
            <p className="text-white text-sm font-bold mb-2">Available on:</p>
          )}
          <div className="flex gap-2 justify-center flex-wrap">
            {state.providers.map((p) => (
              <Image
                key={p.provider_id}
                src={`https://media.themoviedb.org/t/p/original${p.logo_path}`}
                width={40}
                height={40}
                alt={p.provider_name}
                className="rounded-md border border-white/20"
              />
            ))}
          </div>
        </div>

        {/* Action btns */}
        {user && (
          <div className="absolute bottom-10 grid grid-cols-2 gap-5 w-full px-5">
            <button
              onClick={handleToggleWatched}
              className={`${
                isWatched ? "bg-green-600/80" : "bg-red-600/80"
              } rounded py-2 text-sm transition-all hover:opacity-90`}>
              {isWatched ? "Not Watched" : "Watched"}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full bg-blue-600/80 rounded py-2 text-sm transition-all hover:bg-blue-600">
                Add Collection
              </button>

              {showDropdown && (
                <div className="absolute xl:max-h-80 scroll-bar-hide overflow-y-scroll bottom-full mb-2 right-0 w-48 bg-dark-body2 border border-white/10 rounded-xl shadow-2xl p-2 z-50">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      openModal(null, handleCollectionSubmit);
                    }}
                    className="w-full text-left px-3 py-2 text-brand font-bold text-sm border-b border-white/10 mb-1">
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
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          isAdded
                            ? "bg-yellow-500/10 text-yellow-500 font-semibold"
                            : "text-white hover:bg-brand/20"
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
