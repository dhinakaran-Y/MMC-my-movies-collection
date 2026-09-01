"use client";

import { useAuth } from "@/components/context/AuthContext";
import { useCollectionModal } from "@/components/context/CollectionModalContext";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MovieCard from "./MovieCard";
import Pagination from "./Pagination";
import ImdbGuide from "./ImdbGuide";
const API_KEY = "3472ccb0d97ebc192cbd0e56bd799736";
const BASE_URL = "https://api.themoviedb.org/3";

export default function HomeGrid({
  movieArr,
  currentPage,
  displayTotalPages,
  mediaType = "movie",
  provider = "tmdb",
  providerCounts = null,
}) {
  const { user } = useAuth();
  const { openModal } = useCollectionModal();
  const searchParams = useSearchParams();

  const isAllProviders = searchParams.get("allProviders") === "true" || provider === "all";
  const [movies, setMovies] = useState(movieArr || []);
  const [totalPages, setTotalPages] = useState(displayTotalPages || 1);
  const [loadingFallback, setLoadingFallback] = useState(false);

  // Sync state with props when SSR movieArr updates
  useEffect(() => {
    setMovies(movieArr || []);
    setTotalPages(displayTotalPages || 1);
  }, [movieArr, displayTotalPages]);

  // Client-side fallback: if server-side fetch returned generic movies, but logged-in user has a preferred language,
  // fetch preferred language movies directly in browser!
  useEffect(() => {
    const activeProvider = searchParams.get("provider") || "tmdb";

    // ── Multi-Provider Search Client-Side Fallback ──
    if (isAllProviders) {
      if (movieArr && movieArr.length > 0) {
        setMovies(movieArr);
        setTotalPages(displayTotalPages || 1);
        return;
      }

      const q = searchParams.get("query");
      if (!q) {
        setMovies([]);
        return;
      }

      let isMounted = true;
      setLoadingFallback(true);

      fetch(`/api/search/all?query=${encodeURIComponent(q)}`)
        .then((res) => (res.ok ? res.json() : { results: [], total_pages: 1 }))
        .then((data) => {
          if (!isMounted) return;
          setMovies(data.results || []);
          setTotalPages(data.total_pages || 1);
        })
        .catch((err) => {
          console.error("Multi-provider search error:", err);
          if (isMounted) setMovies([]);
        })
        .finally(() => {
          if (isMounted) setLoadingFallback(false);
        });

      return () => {
        isMounted = false;
      };
    }

    // ── AniList Client-Side Fallback ──
    if (activeProvider === "anilist") {
      if (movieArr && movieArr.length > 0) {
        setMovies(movieArr);
        setTotalPages(displayTotalPages || 1);
        return;
      }

      let isMounted = true;
      setLoadingFallback(true);

      const qs = new URLSearchParams(searchParams.toString());
      fetch(`/api/anilist/browse?${qs.toString()}`)
        .then((res) => (res.ok ? res.json() : { results: [], total_pages: 1 }))
        .then((data) => {
          if (!isMounted) return;
          setMovies(data.results || []);
          setTotalPages(data.total_pages || 1);
        })
        .catch((err) => {
          console.error("AniList client fallback error:", err);
          if (isMounted) setMovies([]);
        })
        .finally(() => {
          if (isMounted) setLoadingFallback(false);
        });

      return () => {
        isMounted = false;
      };
    }

    // ── Watchmode Client-Side Fallback ──
    if (activeProvider === "watchmode") {
      if (movieArr && movieArr.length > 0) {
        setMovies(movieArr);
        setTotalPages(displayTotalPages || 1);
        return;
      }

      let isMounted = true;
      setLoadingFallback(true);

      const qs = new URLSearchParams(searchParams.toString());
      fetch(`/api/watchmode/titles?${qs.toString()}`)
        .then((res) => (res.ok ? res.json() : { results: [], total_pages: 1 }))
        .then((data) => {
          if (!isMounted) return;
          setMovies(data.results || []);
          setTotalPages(data.total_pages || 1);
        })
        .catch((err) => {
          console.error("Watchmode client fallback error:", err);
          if (isMounted) setMovies([]);
        })
        .finally(() => {
          if (isMounted) setLoadingFallback(false);
        });

      return () => {
        isMounted = false;
      };
    }
    // ── OMDb: SSR-only, no client-side fallback needed ──
    if (activeProvider === "omdb") {
      if (movieArr && movieArr.length > 0) {
        setMovies(movieArr);
        setTotalPages(displayTotalPages || 1);
      }
      return;
    }

    // ── TVmaze Client-Side Fallback ──
    if (activeProvider === "tvmaze") {
      // If SSR already provided movies, use them directly!
      if (movieArr && movieArr.length > 0) {
        setMovies(movieArr);
        setTotalPages(displayTotalPages || 1);
        return;
      }

      let isMounted = true;
      setLoadingFallback(true);

      const qs = new URLSearchParams(searchParams.toString());
      fetch(`/api/tvmaze/shows?${qs.toString()}`)
        .then((res) => (res.ok ? res.json() : { results: [], total_pages: 1 }))
        .then((data) => {
          if (!isMounted) return;
          setMovies(data.results || []);
          setTotalPages(data.total_pages || 1);
        })
        .catch((err) => {
          console.error("TVmaze client fallback error:", err);
          if (isMounted) setMovies([]);
        })
        .finally(() => {
          if (isMounted) setLoadingFallback(false);
        });

      return () => {
        isMounted = false;
      };
    }

    // ── TMDB: SSR provides movieArr directly (server-side fetched with retry) ──
    if (activeProvider === "tmdb" || !activeProvider) {
      if (movieArr) {
        setMovies(movieArr);
        setTotalPages(displayTotalPages || 1);
      }
      return;
    }
  }, [movieArr, searchParams, user?.language, mediaType, provider, displayTotalPages, isAllProviders]);

  const router = useRouter();
  const activeProvider = searchParams.get("provider") || "tmdb";
  const activeSortBy = searchParams.get("sortBy") || (activeProvider === "anilist" ? "POPULARITY_DESC" : "popularity.desc");

  const handleSortChange = (newSort) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (newSort) params.set("sortBy", newSort);
    else params.delete("sortBy");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const typeLabel =
    activeProvider === "tvmaze"
      ? "TV shows"
      : activeProvider === "watchmode"
        ? "Watchmode titles"
        : mediaType === "tv"
          ? "TV shows"
          : "movies";

  return (
    <main className="col-span-full lg:col-span-9 lg:h-full lg:overflow-y-auto p-8 custom-scrollbar">
      {/* Multi-Provider Search Status Header */}
      {isAllProviders && searchParams.get("query") && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 p-4 bg-gradient-to-r from-brand/15 via-slate-900/80 to-slate-900/90 border border-brand/30 rounded-2xl backdrop-blur-md shadow-lg shadow-brand/5">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-brand animate-pulse shadow-[0_0_10px_rgba(229,9,20,0.9)]" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Multi-Provider Search Results
                <span className="text-white/50 font-normal">({movies.length} matches)</span>
              </span>
              <span className="text-[11px] text-white/60">
                Aggregated across TMDB, AniList, TVmaze, Watchmode, and OMDb
              </span>
            </div>
          </div>

          {providerCounts && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {Object.entries(providerCounts).map(([prov, count]) => (
                <span
                  key={prov}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-black/40 border border-white/15 text-white/80 backdrop-blur-sm">
                  {prov}: <span className="text-brand font-extrabold">{count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Header Bar with Top-Right Sort Dropdown (Exclusively for AniList) */}
      {activeProvider === "anilist" && !isAllProviders && (
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-brand rounded-full inline-block animate-pulse"></span>
              {searchParams.get("category")
                ? `${searchParams.get("category").replace(/_/g, " ")}`
                : "AniList Collection"}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">
              Sort
            </span>
            <div className="relative">
              <select
                value={activeSortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-slate-800/80 text-white text-xs font-semibold px-3.5 py-1.5 pr-8 rounded-xl border border-white/15 focus:border-brand focus:ring-1 focus:ring-brand outline-none cursor-pointer appearance-none shadow-sm hover:border-white/30 transition-all">
                <option value="TRENDING_DESC">Trending</option>
                <option value="POPULARITY_DESC">Popularity</option>
                <option value="SCORE_DESC">Average Score</option>
                <option value="FAVOURITES_DESC">Favorites</option>
                <option value="START_DATE_DESC">Release Date</option>
                <option value="TITLE_ENGLISH">Title</option>
                <option value="ID_DESC">Date Added</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-white/40">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeProvider === "omdb" && !isAllProviders && (searchParams.get("guide") === "imdb_id" || searchParams.get("guide") === "true") ? (
        <ImdbGuide />
      ) : activeProvider === "omdb" && !isAllProviders && !searchParams.get("query") && !searchParams.get("imdbId") ? (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-2xl shadow-lg shadow-amber-500/5">
            🎬
          </div>
          <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
            Search Movies & TV Shows on OMDb
          </h2>
          <p className="text-sm text-white/50 max-w-md leading-relaxed">
            Use the left sidebar to search by <span className="text-amber-400 font-semibold">Title</span>, <span className="text-amber-400 font-semibold">Release Year</span>, <span className="text-amber-400 font-semibold">Type</span>, or <span className="text-amber-400 font-semibold">IMDb ID</span>.
          </p>
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("guide", "imdb_id");
              router.push(`?${params.toString()}`, { scroll: false });
            }}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all hover:scale-[1.02] cursor-pointer shadow-md"
          >
            <span>💡 How to get a movie&apos;s IMDb ID?</span>
            <span className="text-amber-400 font-bold">→</span>
          </button>
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {movies.map((movie) => (
            <MovieCard
              key={movie.compositeId || `${movie.provider || activeProvider}-${movie.id}`}
              movie={movie}
              mediaType={movie.mediaType || (activeProvider === "tvmaze" ? "tv" : mediaType)}
              provider={movie.provider || activeProvider}
            />
          ))}
        </div>
      ) : loadingFallback ? (
        <div className="h-[60vh] flex flex-col items-center justify-center text-white/40">
          <p className="text-xl font-semibold tracking-tight animate-pulse">
            Loading {typeLabel}...
          </p>
        </div>
      ) : (
        <div className="h-[60vh] flex flex-col items-center justify-center text-white/40">
          <p className="text-xl font-semibold tracking-tight">
            No {typeLabel} found matching your current filters.
          </p>
        </div>
      )}

      {movies.length > 0 && (
        <div className="mt-12 mb-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </div>
      )}
    </main>
  );
}
