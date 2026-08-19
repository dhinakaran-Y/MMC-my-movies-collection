export const dynamic = "force-dynamic";

import AsideFilter from "@/components/AsideFilter";
import HomeGrid from "@/components/HomeGrid";
import {
  getShows as tvmazeGetShows,
  getGenres as tvmazeGenres,
  getLanguages as tvmazeLanguages,
  getShowStatuses as tvmazeStatuses,
  getShowTypes as tvmazeShowTypes,
  getCountries as tvmazeCountries,
} from "@/lib/providers/tvmazeAdapter";
import {
  browseMedia as watchmodeBrowse,
  searchMedia as watchmodeSearch,
  getGenres as watchmodeGenres,
} from "@/lib/providers/watchmodeAdapter";

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

/* ── TMDB getMedia (unchanged logic) ── */
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
  const officialReleaseTypes = "1|2|3|4|5|6";
  const dateField = isTV ? "first_air_date" : "release_date";
  let url = "";
  let isSearch = false;

  if (query) {
    const searchType = isTV ? "tv" : "movie";
    url = `${BASE_URL}/search/${searchType}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
    isSearch = true;
  } else if (topRated && !lang && !genre) {
    const discoverType = isTV ? "tv" : "movie";
    url = `${BASE_URL}/discover/${discoverType}?api_key=${API_KEY}&page=${page}`;
    url += `&sort_by=vote_average.desc&vote_count.gte=${isTV ? 100 : 150}`;
    url += `&${dateField}.lte=${today}`;
    if (!isTV) {
      url += `&with_release_type=${encodeURIComponent(officialReleaseTypes)}`;
    }
  } else {
    const discoverType = isTV ? "tv" : "movie";
    url = `${BASE_URL}/discover/${discoverType}?api_key=${API_KEY}&page=${page}`;
    if (genre) url += `&with_genres=${genre}`;
    if (lang) url += `&with_original_language=${lang}`;
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

  try {
    const res = await fetchWithRetry(url, { next: { revalidate: 3600 } });
    if (!res.ok) return { results: [], total_pages: 0 };
    const data = await res.json();

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
      { next: { revalidate: 86400 } },
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
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.genres || [];
  } catch {
    return [];
  }
}

/* ── TVmaze SSR data fetch ── */
async function getTvmazeData(params) {
  const page = Number(params.page) || 1;
  const query = params.query || "";
  const genres = params.genre ? params.genre.split(",") : [];
  const language = params.lang && params.lang !== "all" ? params.lang : "";
  const status = params.showStatus || "";
  const showType = params.showType || "";
  const country = params.country || "";
  const sortBy = params.sortBy || "popularity";

  return await tvmazeGetShows({
    page,
    query,
    genres,
    language,
    status,
    showType,
    country,
    sortBy,
  });
}

/* ── Watchmode SSR data fetch ── */
async function getWatchmodeData(params) {
  const query = params.query || "";
  const page = Number(params.page) || 1;

  if (query) {
    return await watchmodeSearch(query, page);
  }

  return await watchmodeBrowse({
    page,
    region: params.region || "US",
    wmType: params.wmType || "",
    serviceTypes: params.serviceTypes || "",
    sourceIds: params.sourceIds || "",
    genre: params.genre || "",
    yearStart: params.yearStart || "",
    yearEnd: params.yearEnd || "",
    ratingLow: params.ratingLow || "",
    ratingHigh: params.ratingHigh || "",
    criticLow: params.criticLow || "",
    criticHigh: params.criticHigh || "",
    lang: params.lang || "",
    sortBy: params.sortBy || "popularity_desc",
  });
}

export default async function Home({ searchParams }) {
  const params = await searchParams;

  const provider = params.provider || "tmdb";
  const currentPage = Number(params.page) || 1;

  // ── Watchmode Provider ──
  if (provider === "watchmode") {
    const [watchmodeData, genresArr] = await Promise.all([
      getWatchmodeData(params),
      watchmodeGenres(),
    ]);

    const movieArr = watchmodeData.results || [];
    const displayTotalPages = watchmodeData.total_pages || 1;

    return (
      <div className="lg:h-screen grid grid-cols-12 gap-3 bg-dark-body1 overflow-hidden">
        <AsideFilter
          genresArr={genresArr}
          currentLang={params.lang || ""}
          currentGenre={params.genre || ""}
          currentQuery={params.query || ""}
          currentType={params.wmType === "movie" ? "movie" : "tv"}
          provider="watchmode"
        />

        <HomeGrid
          movieArr={movieArr}
          currentPage={currentPage}
          displayTotalPages={displayTotalPages}
          mediaType={params.wmType === "movie" ? "movie" : "tv"}
          provider="watchmode"
        />
      </div>
    );
  }

  // ── TVmaze Provider ──
  if (provider === "tvmaze") {
    const tvmazeData = await getTvmazeData(params);
    const movieArr = tvmazeData.results || [];
    const displayTotalPages = tvmazeData.total_pages || 1;

    // Build genre list for sidebar (TVmaze: string-based, no IDs)
    const genresArr = tvmazeGenres().map((name) => ({ id: name, name }));

    return (
      <div className="lg:h-screen grid grid-cols-12 gap-3 bg-dark-body1 overflow-hidden">
        <AsideFilter
          genresArr={genresArr}
          currentLang={params.lang || ""}
          currentGenre={params.genre || ""}
          currentQuery={params.query || ""}
          currentType="tv"
          provider="tvmaze"
        />

        <HomeGrid
          movieArr={movieArr}
          currentPage={currentPage}
          displayTotalPages={displayTotalPages}
          mediaType="tv"
          provider="tvmaze"
        />
      </div>
    );
  }

  // ── TMDB Provider (default — unchanged logic) ──
  const isTopRated = params.topRated === "true";
  const language = params.lang === "all" ? "" : (params.lang || "");
  const query = params.query || "";
  const genre = params.genre || "";
  const mediaType = params.type === "tv" ? "tv" : "movie";

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
      <AsideFilter
        genresArr={genresArr}
        currentLang={language}
        currentGenre={genre}
        currentQuery={query}
        currentType={mediaType}
        provider="tmdb"
      />

      <HomeGrid
        movieArr={movieArr}
        currentPage={currentPage}
        displayTotalPages={displayTotalPages}
        mediaType={mediaType}
        provider="tmdb"
      />
    </div>
  );
}
