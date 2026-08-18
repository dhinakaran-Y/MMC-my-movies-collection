"use client";

import { useAuth } from "@/components/context/AuthContext";
import { useCollectionModal } from "@/components/context/CollectionModalContext";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import MovieCard from "./MovieCard";
import Pagination from "./Pagination";

const API_KEY = "3472ccb0d97ebc192cbd0e56bd799736";
const BASE_URL = "https://api.themoviedb.org/3";

export default function HomeGrid({ movieArr, currentPage, displayTotalPages, mediaType = "movie" }) {
  const { user } = useAuth();
  const { openModal } = useCollectionModal();
  const searchParams = useSearchParams();

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
    const hasLangParam = searchParams.has("lang");
    const preferredLang = user?.language || "";

    // If explicit ?lang param exists in URL OR user has no preferred language set, use SSR movieArr if available
    if (hasLangParam || !preferredLang) {
      if (movieArr && movieArr.length > 0) return;
    }

    let isMounted = true;
    setLoadingFallback(true);

    const page = Number(searchParams.get("page")) || 1;
    const topRated = searchParams.get("topRated") === "true";
    const lang = hasLangParam
      ? (searchParams.get("lang") === "all" ? "" : (searchParams.get("lang") || ""))
      : preferredLang;
    const query = searchParams.get("query") || "";
    const genre = searchParams.get("genre") || "";

    const today = new Date().toISOString().split("T")[0];
    const isTV = mediaType === "tv";
    // Release types (movies only): 1=Premiere, 2=Theatrical (limited), 3=Theatrical, 4=Digital, 5=Physical, 6=TV
    const officialReleaseTypes = "1|2|3|4|5|6";
    // Date field differs: movies use release_date, TV uses first_air_date
    const dateField = isTV ? "first_air_date" : "release_date";
    const searchEndpoint = isTV ? "tv" : "movie";
    const discoverEndpoint = isTV ? "tv" : "movie";

    let url = "";
    let isSearch = false;

    if (query) {
      url = `${BASE_URL}/search/${searchEndpoint}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
      isSearch = true;
    } else if (topRated && !lang && !genre) {
      url = `${BASE_URL}/discover/${discoverEndpoint}?api_key=${API_KEY}&page=${page}`;
      url += `&sort_by=vote_average.desc&vote_count.gte=${isTV ? 100 : 150}`;
      url += `&${dateField}.lte=${today}`;
      if (!isTV) {
        url += `&with_release_type=${encodeURIComponent(officialReleaseTypes)}`;
      }
    } else {
      url = `${BASE_URL}/discover/${discoverEndpoint}?api_key=${API_KEY}&page=${page}`;
      if (genre) url += `&with_genres=${genre}`;
      if (lang) url += `&with_original_language=${lang}`;

      // Restrict to already-aired/released content
      url += `&${dateField}.lte=${today}`;
      if (!isTV) {
        url += `&with_release_type=${encodeURIComponent(officialReleaseTypes)}`;
      }

      if (topRated) {
        const minVotes = lang ? 5 : (isTV ? 100 : 150);
        url += `&sort_by=vote_average.desc&vote_count.gte=${minVotes}`;
      } else if (lang) {
        url += `&sort_by=popularity.desc`;
      } else {
        url += `&sort_by=${dateField}.desc`;
      }
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;

        let results = data.results || [];

        // For search results, filter out placeholder/unauthorized entries
        if (isSearch) {
          results = results.filter((item) => {
            const hasBasicInfo = item.poster_path && item.overview;
            const itemDate = isTV ? item.first_air_date : item.release_date;
            const isReleased = !itemDate || itemDate <= today;
            return hasBasicInfo && isReleased;
          });
        }

        if (results.length > 0) {
          setMovies(results);
          setTotalPages(Math.min(data.total_pages || 1, 500));
        }
      })
      .catch((err) => console.error("Client fallback fetch error:", err))
      .finally(() => {
        if (isMounted) setLoadingFallback(false);
      });

    return () => {
      isMounted = false;
    };
  }, [movieArr, searchParams, user?.language, mediaType]);

  const typeLabel = mediaType === "tv" ? "TV shows" : "movies";

  return (
    <main className="col-span-full lg:col-span-9 lg:h-full lg:overflow-y-auto p-8 custom-scrollbar">
      {movies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} mediaType={mediaType} />
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
