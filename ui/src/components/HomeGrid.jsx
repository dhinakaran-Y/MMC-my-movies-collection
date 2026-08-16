"use client";

import { useAuth } from "@/components/context/AuthContext";
import { useCollectionModal } from "@/components/context/CollectionModalContext";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import MovieCard from "./MovieCard";
import Pagination from "./Pagination";

const API_KEY = "3472ccb0d97ebc192cbd0e56bd799736";
const BASE_URL = "https://api.themoviedb.org/3";

export default function HomeGrid({ movieArr, currentPage, displayTotalPages }) {
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

  // Client-side fallback: if server-side fetch failed (empty movieArr), fetch directly in browser
  useEffect(() => {
    if (movieArr && movieArr.length > 0) return;

    let isMounted = true;
    setLoadingFallback(true);

    const page = Number(searchParams.get("page")) || 1;
    const topRated = searchParams.get("topRated") === "true";
    const lang = searchParams.get("lang") || "";
    const query = searchParams.get("query") || "";
    const genre = searchParams.get("genre") || "";

    let url = "";
    if (query) {
      url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
    } else if (topRated && !lang && !genre) {
      url = `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&page=${page}`;
    } else {
      url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&page=${page}`;
      if (genre) url += `&with_genres=${genre}`;
      if (lang) url += `&with_original_language=${lang}`;
      if (topRated) {
        const minVotes = lang ? 5 : 150;
        url += `&sort_by=vote_average.desc&vote_count.gte=${minVotes}`;
      } else if (lang) {
        url += `&sort_by=popularity.desc`;
      } else {
        const today = new Date().toISOString().split("T")[0];
        url += `&release_date.lte=${today}&with_release_type=3%7C4&sort_by=release_date.desc`;
      }
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.results && data.results.length > 0) {
          setMovies(data.results);
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
  }, [movieArr, searchParams]);

  return (
    <main className="col-span-full lg:col-span-9 lg:h-full lg:overflow-y-auto p-8 custom-scrollbar">
      {movies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : loadingFallback ? (
        <div className="h-[60vh] flex flex-col items-center justify-center text-white/40">
          <p className="text-xl font-semibold tracking-tight animate-pulse">
            Loading movies...
          </p>
        </div>
      ) : (
        <div className="h-[60vh] flex flex-col items-center justify-center text-white/40">
          <p className="text-xl font-semibold tracking-tight">
            No movies found matching your current filters.
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
