import AsideFilter from "@/components/AsideFilter";
import CollectionCreateForm from "@/components/CollectionComponents/CollectionCreateForm";
import HomeGrid from "@/components/HomeGrid";
import MovieCard from "@/components/MovieCard";
import Pagination from "@/components/Pagination";
import LanguageRegionMappedData from "@/data/LanguageRegionMappedData.json";

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

async function fetchWithRetry(url, options = {}, retries = 5, delayMs = 500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (attempt === retries) return res;
    } catch (error) {
      if (attempt === retries) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

/* getMedia Fn — supports both "movie" and "tv" media types
 * 1. search query
 * 2. genre filtering
 * 3. language
 * 4. top rated
 * 5. media type (movie | tv)
 */
async function getMedia(
  page = 1,
  topRated = false,
  lang = "",
  query = "",
  genre = "",
  type = "movie",
) {
  const today = new Date().toISOString().split("T")[0];
  const isTV = type === "tv";
  // Release types (movies only): 1=Premiere, 2=Theatrical (limited), 3=Theatrical, 4=Digital, 5=Physical, 6=TV
  const officialReleaseTypes = "1|2|3|4|5|6";
  // Date field differs: movies use release_date, TV uses first_air_date
  const dateField = isTV ? "first_air_date" : "release_date";
  let url = "";
  let isSearch = false;

  // 1. Search
  if (query) {
    const searchType = isTV ? "tv" : "movie";
    url = `${BASE_URL}/search/${searchType}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
    isSearch = true;
  }

  // 2. Top Rated (Global - no other filters applied)
  else if (topRated && !lang && !genre) {
    const discoverType = isTV ? "tv" : "movie";
    url = `${BASE_URL}/discover/${discoverType}?api_key=${API_KEY}&page=${page}`;
    url += `&sort_by=vote_average.desc&vote_count.gte=${isTV ? 100 : 150}`;
    url += `&${dateField}.lte=${today}`;
    // with_release_type only works for movies
    if (!isTV) {
      url += `&with_release_type=${encodeURIComponent(officialReleaseTypes)}`;
    }
  }

  // 3. Discover - Filter
  else {
    const discoverType = isTV ? "tv" : "movie";
    url = `${BASE_URL}/discover/${discoverType}?api_key=${API_KEY}&page=${page}`;

    // genre
    if (genre) {
      url += `&with_genres=${genre}`;
    }

    // language
    if (lang) {
      url += `&with_original_language=${lang}`;
    }

    // Restrict to already-aired/released content
    url += `&${dateField}.lte=${today}`;
    // with_release_type only works for movies
    if (!isTV) {
      url += `&with_release_type=${encodeURIComponent(officialReleaseTypes)}`;
    }

    // sorting
    if (topRated) {
      const minVotes = lang ? 5 : (isTV ? 100 : 150);
      url += `&sort_by=vote_average.desc&vote_count.gte=${minVotes}`;
    } else if (lang) {
      url += `&sort_by=popularity.desc`;
    } else {
      // Default discovery — sort by most recent
      url += `&sort_by=${dateField}.desc`;
    }
  }

  // console.log("URL:", url);

  try {
    const res = await fetchWithRetry(url, { next: { revalidate: 3600 } });
    if (!res.ok) return { results: [], total_pages: 0 };
    const data = await res.json();

    // For search results, filter out placeholder/unauthorized entries
    if (isSearch && data.results) {
      data.results = data.results.filter((item) => {
        const hasBasicInfo = item.poster_path && item.overview;
        const itemDate = isTV ? item.first_air_date : item.release_date;
        const isReleased = !itemDate || itemDate <= today;
        return hasBasicInfo && isReleased;
      });
    }

    return data;
  } catch (error) {
    console.error("Fetch Error after retries:", error);
    return { results: [], total_pages: 0 };
  }
}

async function getLanguages() {
  try {
    const res = await fetchWithRetry(
      `${BASE_URL}/configuration/languages?api_key=${API_KEY}`,
      {
        next: { revalidate: 86400 },
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.sort((a, b) => a.english_name.localeCompare(b.english_name));
  } catch {
    return [];
  }
}

async function getGenres(type = "movie") {
  try {
    const genreType = type === "tv" ? "tv" : "movie";
    const res = await fetchWithRetry(
      `${BASE_URL}/genre/${genreType}/list?api_key=${API_KEY}`,
      {
        next: { revalidate: 86400 },
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.genres || [];
  } catch {
    return [];
  }
}

export default async function Home({ searchParams }) {
  // Await searchParams for Next.js 15+
  const params = await searchParams;

  const currentPage = Number(params.page) || 1;
  const isTopRated = params.topRated === "true";
  const language = params.lang === "all" ? "" : (params.lang || "");
  const query = params.query || "";
  const genre = params.genre || "";
  const mediaType = params.type === "tv" ? "tv" : "movie";

  // Fetch all secondary data and main media data in parallel
  const [mediaData, languagesArr, genresArr] = await Promise.all([
    getMedia(currentPage, isTopRated, language, query, genre, mediaType),
    getLanguages(),
    getGenres(mediaType),
  ]);

  const movieArr = mediaData.results || [];
  const apiLimit = 500;
  const actualTotalPages = mediaData.total_pages || 1;
  const displayTotalPages = Math.min(actualTotalPages, apiLimit);

  return (
    <div className="lg:h-screen grid grid-cols-12 gap-3 bg-dark-body1 overflow-hidden">
      {/* Sidebar - Pass query, lang, genres, and media type to manage UI states */}
      <AsideFilter
        genresArr={genresArr}
        currentLang={language}
        currentGenre={genre}
        currentQuery={query}
        currentType={mediaType}
      />

      <HomeGrid
        movieArr={movieArr}
        currentPage={currentPage}
        displayTotalPages={displayTotalPages}
        mediaType={mediaType}
      />
    </div>
  );
}
