export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import AsideFilter from "@/components/AsideFilter";
import HomeGrid from "@/components/HomeGrid";
import AniListHomepage from "@/components/AniListHomepage";
import FilteredLanguagesArr from "@/data/FilteredLanguagesArr.json";
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
import {
  browseMedia as anilistBrowse,
  searchMedia as anilistSearch,
  getAnimeSeasons as anilistAnimeSeasons,
  getGenres as anilistGenres,
  getTags as anilistTags,
} from "@/lib/providers/anilistAdapter";
import { searchMedia as omdbSearch } from "@/lib/providers/omdbAdapter";
import { searchAllProviders } from "@/lib/providers/multiProviderSearch";
import { tmdbFetch } from "@/lib/providers/tmdbFetch";

const API_KEY = process.env.TMDB_API_KEY || "3472ccb0d97ebc192cbd0e56bd799736";
const BASE_URL = "https://api.themoviedb.org/3";

function getTvmazeLanguage(langCodeOrName) {
  if (!langCodeOrName || langCodeOrName === "all") return "";
  const allTvmazeLangs = tvmazeLanguages();
  const foundByName = allTvmazeLangs.find(
    (l) => l.toLowerCase() === langCodeOrName.toLowerCase()
  );
  if (foundByName) return foundByName;

  const mapped = FilteredLanguagesArr.find(
    (l) => l.language.toLowerCase() === langCodeOrName.toLowerCase()
  );
  if (mapped) {
    const matched = allTvmazeLangs.find(
      (l) => l.toLowerCase() === mapped.languageName.toLowerCase()
    );
    if (matched) return matched;
  }
  return langCodeOrName;
}

/* ── TMDB getMedia ── */
async function getMedia(
  page = 1,
  topRated = false,
  lang = "",
  query = "",
  genre = "",
  type = "movie",
  sortBy = "",
) {
  const today = new Date().toISOString().split("T")[0];
  const isTV = type === "tv";
  const officialReleaseTypes = "1|2|3|4|5|6";
  const dateField = isTV ? "first_air_date" : "release_date";
  let url = "";
  let isSearch = false;

  const resolvedSort = sortBy || (topRated ? "vote_average.desc" : "popularity.desc");
  const isSortByRating = resolvedSort.startsWith("vote_average");
  const isSortByDate = resolvedSort.startsWith("release_date") || resolvedSort.startsWith("first_air_date");

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

    if (isSortByRating || topRated) {
      const minVotes = lang ? 5 : (isTV ? 100 : 150);
      url += `&sort_by=vote_average.desc&vote_count.gte=${minVotes}`;
    } else if (isSortByDate) {
      url += `&sort_by=${dateField}.desc`;
    } else {
      url += `&sort_by=popularity.desc`;
    }
  }

  try {
    const res = await tmdbFetch(url);
    if (!res.ok) return { results: [], total_pages: 0 };
    const data = await res.json();

    if (data.results) {
      data.results = data.results.filter((item) => {
        const hasImage = Boolean(item.poster_path || item.backdrop_path);
        if (!isSearch) return hasImage;
        const hasBasicInfo = hasImage && item.overview;
        const itemDate = isTV ? item.first_air_date : item.release_date;
        const isReleased = !itemDate || itemDate <= today;
        return hasBasicInfo && isReleased;
      });
    }

    return data;
  } catch (error) {
    console.error("TMDB getMedia Error:", error);
    return { results: [], total_pages: 0 };
  }
}

async function getLanguages() {
  try {
    const res = await tmdbFetch(
      `${BASE_URL}/configuration/languages?api_key=${API_KEY}`
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
    const res = await tmdbFetch(
      `${BASE_URL}/genre/${genreType}/list?api_key=${API_KEY}`
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

/* ── AniList SSR data fetch ── */
async function getAnilistData(params) {
  const query = params.query || "";
  const page = Number(params.page) || 1;
  const type = (params.type || "ANIME").toUpperCase() === "MANGA" ? "MANGA" : "ANIME";
  const category = params.category || (query || params.genre || params.tag ? "" : "trending");

  const { currentSeason, currentYear, nextSeason, nextYear } = anilistAnimeSeasons();

  let season = params.season || "";
  let seasonYear = params.seasonYear || "";
  let status = params.status || "";
  let sortBy = params.sortBy || "";

  if (category === "trending") {
    sortBy = sortBy || "TRENDING_DESC";
  } else if (category === "this_season") {
    if (type === "ANIME") {
      season = season || currentSeason;
      seasonYear = seasonYear || currentYear;
      sortBy = sortBy || "POPULARITY_DESC";
    } else {
      sortBy = sortBy || "SCORE_DESC";
    }
  } else if (category === "next_season") {
    if (type === "ANIME") {
      season = season || nextSeason;
      seasonYear = seasonYear || nextYear;
      status = status || "NOT_YET_RELEASED";
      sortBy = sortBy || "POPULARITY_DESC";
    } else {
      status = status || "RELEASING";
      sortBy = sortBy || "POPULARITY_DESC";
    }
  } else if (category === "all_time_popular") {
    sortBy = sortBy || "POPULARITY_DESC";
  } else if (category === "top_100") {
    sortBy = sortBy || "SCORE_DESC";
  } else {
    sortBy = sortBy || "POPULARITY_DESC";
  }

  if (query) {
    return await anilistSearch(query, page, type);
  }

  return await anilistBrowse({
    page,
    type,
    genre: params.genre || "",
    tag: params.tag || "",
    season,
    seasonYear,
    format: params.format || "",
    status,
    source: params.source || "",
    country: params.country || "",
    streamingOn: params.streamingOn || "",
    yearStart: params.yearStart || "",
    yearEnd: params.yearEnd || "",
    episodesMin: params.episodesMin || "",
    episodesMax: params.episodesMax || "",
    durationMin: params.durationMin || "",
    durationMax: params.durationMax || "",
    sortBy,
  });
}

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const userLangCookie = cookieStore.get("user_lang")?.value || "";

  const provider = params.provider || "tmdb";
  const currentPage = Number(params.page) || 1;

  // ── Multi-Provider Search (All Providers Aggregated) ──
  if (params.allProviders === "true" && params.query) {
    const [allData, languagesArr, genresArr] = await Promise.all([
      searchAllProviders(params.query),
      getLanguages(),
      getGenres(params.type === "tv" ? "tv" : "movie"),
    ]);

    return (
      <div className="lg:h-screen grid grid-cols-12 gap-3 bg-dark-body1 overflow-hidden">
        <AsideFilter
          genresArr={genresArr}
          currentLang={params.lang || ""}
          currentGenre={params.genre || ""}
          currentQuery={params.query || ""}
          currentType={params.type || "movie"}
          provider={provider}
        />

        <HomeGrid
          movieArr={allData.results || []}
          currentPage={currentPage}
          displayTotalPages={allData.total_pages || 1}
          mediaType={params.type === "tv" ? "tv" : "movie"}
          provider="all"
          providerCounts={allData.providerCounts}
        />
      </div>
    );
  }

  // ── AniList Provider ──
  if (provider === "anilist") {
    const anilistType = (params.type || "ANIME").toUpperCase() === "MANGA" ? "MANGA" : "ANIME";
    const [anilistData, genresArr, tagsArr] = await Promise.all([
      getAnilistData(params),
      anilistGenres(),
      anilistTags(),
    ]);

    return (
      <div className="lg:h-screen grid grid-cols-12 gap-3 bg-dark-body1 overflow-hidden">
        <AsideFilter
          genresArr={genresArr}
          tagsArr={tagsArr}
          currentGenre={params.genre || ""}
          currentQuery={params.query || ""}
          currentType={anilistType}
          provider="anilist"
        />

        <HomeGrid
          movieArr={anilistData.results || []}
          currentPage={currentPage}
          displayTotalPages={anilistData.total_pages || 1}
          mediaType={anilistType === "MANGA" ? "manga" : "tv"}
          provider="anilist"
        />
      </div>
    );
  }

  // ── OMDb Provider ──
  if (provider === "omdb") {
    const query = params.query || "";
    const imdbId = params.imdbId || "";
    const omdbData = (query || imdbId)
      ? await omdbSearch({
          query,
          imdbId,
          type: params.type || "",
          year: params.year || "",
          page: currentPage,
        })
      : { results: [], totalPages: 1 };

    return (
      <div className="lg:h-screen grid grid-cols-12 gap-3 bg-dark-body1 overflow-hidden">
        <AsideFilter
          genresArr={[]}
          currentQuery={params.query || ""}
          provider="omdb"
        />

        <HomeGrid
          movieArr={omdbData.results || []}
          currentPage={currentPage}
          displayTotalPages={omdbData.totalPages || 1}
          mediaType={params.type === "series" ? "tv" : "movie"}
          provider="omdb"
        />
      </div>
    );
  }

  // ── Watchmode Provider ──
  if (provider === "watchmode") {
    const hasExplicitLang = params.lang !== undefined;
    const explicitLang = params.lang;
    const resolvedLang = hasExplicitLang
      ? (explicitLang === "all" ? "" : explicitLang)
      : userLangCookie;

    const [watchmodeData, genresArr] = await Promise.all([
      getWatchmodeData({ ...params, lang: resolvedLang }),
      watchmodeGenres(),
    ]);

    const movieArr = watchmodeData.results || [];
    const displayTotalPages = watchmodeData.total_pages || 1;

    return (
      <div className="lg:h-screen grid grid-cols-12 gap-3 bg-dark-body1 overflow-hidden">
        <AsideFilter
          genresArr={genresArr}
          currentLang={hasExplicitLang ? explicitLang : userLangCookie}
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
          initialLang={hasExplicitLang ? explicitLang : userLangCookie}
        />
      </div>
    );
  }

  // ── TVmaze Provider ──
  if (provider === "tvmaze") {
    const hasExplicitLang = params.lang !== undefined;
    const explicitLang = params.lang;
    const tvmazePreferredLang = getTvmazeLanguage(userLangCookie);
    const resolvedLang = hasExplicitLang
      ? (explicitLang === "all" ? "" : explicitLang)
      : tvmazePreferredLang;

    const tvmazeData = await getTvmazeData({ ...params, lang: resolvedLang });
    const movieArr = tvmazeData.results || [];
    const displayTotalPages = tvmazeData.total_pages || 1;

    // Build genre list for sidebar (TVmaze: string-based, no IDs)
    const genresArr = tvmazeGenres().map((name) => ({ id: name, name }));

    return (
      <div className="lg:h-screen grid grid-cols-12 gap-3 bg-dark-body1 overflow-hidden">
        <AsideFilter
          genresArr={genresArr}
          currentLang={hasExplicitLang ? explicitLang : tvmazePreferredLang}
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
          initialLang={hasExplicitLang ? explicitLang : tvmazePreferredLang}
        />
      </div>
    );
  }

  // ── TMDB Provider (default) ──
  const isTopRated = params.topRated === "true";
  const hasExplicitLang = params.lang !== undefined;
  const explicitLang = params.lang;
  const language = hasExplicitLang
    ? (explicitLang === "all" ? "" : explicitLang)
    : userLangCookie;
  const query = params.query || "";
  const genre = params.genre || "";
  const mediaType = params.type === "tv" ? "tv" : "movie";

  const sortBy = params.sortBy || "";

  const [mediaData, languagesArr, genresArr] = await Promise.all([
    getMedia(currentPage, isTopRated, language, query, genre, mediaType, sortBy),
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
        currentLang={hasExplicitLang ? explicitLang : userLangCookie}
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
        initialLang={hasExplicitLang ? explicitLang : userLangCookie}
      />
    </div>
  );
}
