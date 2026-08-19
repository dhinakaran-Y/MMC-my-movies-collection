/**
 * TVmaze API Adapter
 * Supports both:
 * 1. REST API (https://api.tvmaze.com) for show search, show details, episodes
 * 2. Web discovery (https://www.tvmaze.com/shows) for 1-to-1 official website filtering (all 84+ languages, 93+ countries, statuses, types, genres, sort)
 */

import tvmazeEnumsData from "@/data/tvmazeEnums.json";

const TVMAZE_API_BASE = "https://api.tvmaze.com";
const TVMAZE_WEB_BASE = "https://www.tvmaze.com";

// --- Enum Lookup Maps ---
export const LANGUAGE_MAP = {};
for (const [val, name] of tvmazeEnumsData.languages) {
  LANGUAGE_MAP[name.toLowerCase()] = val;
}

export const COUNTRY_MAP = {};
for (const [val, name] of tvmazeEnumsData.countries) {
  COUNTRY_MAP[name.toLowerCase()] = val;
}

export const STATUS_MAP = {};
for (const [val, name] of tvmazeEnumsData.statuses) {
  STATUS_MAP[name.toLowerCase()] = val;
}

export const TYPE_MAP = {};
for (const [val, name] of tvmazeEnumsData.types) {
  TYPE_MAP[name.toLowerCase()] = val;
}

export const GENRE_MAP = {};
for (const [val, name] of tvmazeEnumsData.genres) {
  GENRE_MAP[name.toLowerCase()] = val;
}

export const SORT_MAP = {
  popularity: "1",
  rating: "7",
  name: "3",
  newest: "5",
};

// Country Code to Country Name mapping
export const COUNTRY_CODE_TO_NAME = {
  AF: "Afghanistan",
  AL: "Albania",
  DZ: "Algeria",
  AR: "Argentina",
  AM: "Armenia",
  AU: "Australia",
  AT: "Austria",
  AZ: "Azerbaijan",
  BD: "Bangladesh",
  BY: "Belarus",
  BE: "Belgium",
  BO: "Bolivia, Plurinational State of",
  BA: "Bosnia and Herzegovina",
  BR: "Brazil",
  BG: "Bulgaria",
  CA: "Canada",
  CL: "Chile",
  CN: "China",
  CO: "Colombia",
  CI: "Cote d'Ivoire",
  HR: "Croatia",
  CY: "Cyprus",
  CZ: "Czech Republic",
  DK: "Denmark",
  EG: "Egypt",
  EE: "Estonia",
  FO: "Faroe Islands",
  FI: "Finland",
  FR: "France",
  PF: "French Polynesia",
  GE: "Georgia",
  DE: "Germany",
  GR: "Greece",
  HK: "Hong Kong",
  HU: "Hungary",
  IS: "Iceland",
  IN: "India",
  ID: "Indonesia",
  IR: "Iran, Islamic Republic of",
  IQ: "Iraq",
  IE: "Ireland",
  IL: "Israel",
  IT: "Italy",
  JP: "Japan",
  KZ: "Kazakhstan",
  KP: "Korea, Democratic People's Republic of",
  KR: "Korea, Republic of",
  KW: "Kuwait",
  LV: "Latvia",
  LB: "Lebanon",
  LT: "Lithuania",
  LU: "Luxembourg",
  MY: "Malaysia",
  MV: "Maldives",
  MX: "Mexico",
  MD: "Moldova, Republic of",
  MN: "Mongolia",
  NL: "Netherlands",
  NZ: "New Zealand",
  NG: "Nigeria",
  NO: "Norway",
  PK: "Pakistan",
  PE: "Peru",
  PH: "Philippines",
  PL: "Poland",
  PT: "Portugal",
  PR: "Puerto Rico",
  QA: "Qatar",
  RO: "Romania",
  RU: "Russian Federation",
  SA: "Saudi Arabia",
  RS: "Serbia",
  SG: "Singapore",
  SK: "Slovakia",
  SI: "Slovenia",
  ZA: "South Africa",
  ES: "Spain",
  LK: "Sri Lanka",
  SE: "Sweden",
  CH: "Switzerland",
  TW: "Taiwan, Province of China",
  TH: "Thailand",
  TT: "Trinidad and Tobago",
  TN: "Tunisia",
  TR: "Turkey",
  UA: "Ukraine",
  AE: "United Arab Emirates",
  GB: "United Kingdom",
  US: "United States",
  UZ: "Uzbekistan",
  VU: "Vanuatu",
  VE: "Venezuela, Bolivarian Republic of",
  VN: "Viet Nam",
};

// --- Utilities ---

/**
 * Strip HTML tags from TVmaze summaries.
 */
export function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize a raw TVmaze show object into the unified shape.
 */
export function normalizeShow(raw) {
  const show = raw.show || raw;

  const posterMedium = show.image?.medium || null;
  const posterOriginal = show.image?.original || null;

  const episodes = show._embedded?.episodes;
  const episodeCount = episodes ? episodes.length : undefined;

  const seasons = show._embedded?.seasons;
  const seasonCount = seasons ? seasons.length : undefined;

  const parsedRating =
    typeof show.rating === "number"
      ? show.rating
      : typeof show.rating?.average === "number"
        ? show.rating.average
        : typeof show.vote_average === "number"
          ? show.vote_average
          : null;

  return {
    id: show.id,
    provider: "tvmaze",
    mediaType: "tv",
    compositeId: `tvmaze:tv:${show.id}`,

    title: show.name || show.title || "Untitled",
    name: show.name || show.title || "Untitled",
    overview: stripHtml(show.summary || show.overview || ""),
    poster_path: posterMedium || posterOriginal || show.posterSrc || null,
    posterSrc: posterMedium || posterOriginal || show.posterSrc || "/fallbackImg.png",

    release_date: show.premiered || show.release_date || null,
    first_air_date: show.premiered || show.first_air_date || null,
    ended: show.ended || null,

    vote_average: parsedRating,
    rating: parsedRating,
    popularity: show.weight || show.popularity || 0,
    genres: show.genres || [],
    language: show.language || null,
    status: show.status || null,
    showType: show.type || show.showType || null,
    runtime: show.runtime || show.averageRuntime || null,

    network: show.network
      ? {
          name: show.network.name,
          country: show.network.country?.code || null,
          countryName: show.network.country?.name || null,
        }
      : null,
    webChannel: show.webChannel
      ? {
          name: show.webChannel.name,
          country: show.webChannel.country?.code || null,
          countryName: show.webChannel.country?.name || null,
        }
      : null,

    schedule: show.schedule || null,
    externals: show.externals || {},
    episodeCount,
    seasonCount,
    officialSite: show.officialSite || null,
    _raw: show,
  };
}

// --- REST API Functions ---

/**
 * Search shows by query string.
 * Endpoint: GET https://api.tvmaze.com/search/shows?q={query}
 */
export async function searchShows(query) {
  if (!query || !query.trim()) return { results: [], total_pages: 1 };

  try {
    const res = await fetch(
      `${TVMAZE_API_BASE}/search/shows?q=${encodeURIComponent(query.trim())}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return { results: [], total_pages: 1 };

    const data = await res.json();
    const results = data
      .map((item) => normalizeShow(item))
      .filter((show) => show.posterSrc !== "/fallbackImg.png");

    return { results, total_pages: 1 };
  } catch (error) {
    console.error("TVmaze search error:", error);
    return { results: [], total_pages: 1 };
  }
}

/**
 * Browse paginated show catalog via API.
 * Endpoint: GET https://api.tvmaze.com/shows?page={page}
 */
export async function browseShows(page = 1) {
  const tvmazePage = Math.max(0, page - 1);

  try {
    const res = await fetch(
      `${TVMAZE_API_BASE}/shows?page=${tvmazePage}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      if (res.status === 404) return { results: [], total_pages: tvmazePage };
      return { results: [], total_pages: 1 };
    }

    const data = await res.json();
    const results = data.map((show) => normalizeShow(show));

    return {
      results,
      total_pages: Math.max(tvmazePage + 2, 280),
    };
  } catch (error) {
    console.error("TVmaze browse error:", error);
    return { results: [], total_pages: 1 };
  }
}

/**
 * Get show detail with embedded episodes.
 * Endpoint: GET https://api.tvmaze.com/shows/{id}?embed=episodes
 */
export async function getShowDetail(showId) {
  try {
    const res = await fetch(
      `${TVMAZE_API_BASE}/shows/${showId}?embed=episodes`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;

    const data = await res.json();
    return normalizeShow(data);
  } catch (error) {
    console.error("TVmaze show detail error:", error);
    return null;
  }
}

// --- Official Web Discovery Scraper / Filter Engine ---

/**
 * Queries TVmaze's official website discovery endpoint (https://www.tvmaze.com/shows)
 * which supports exact server-side filtering by:
 * - Language (all 84 languages)
 * - Country (all 93 countries)
 * - Show Status (Running, Ended, etc.)
 * - Show Type (Scripted, Reality, Animation, etc.)
 * - Genre (Action, Drama, Comedy, etc.)
 * - Sort (Popularity, Rating, Name, Newest)
 * - Pagination (page=1, 2, 3, etc.)
 */
export async function fetchWebFilteredShows({
  page = 1,
  language = "",
  country = "",
  showStatus = "",
  showType = "",
  genre = "",
  sortBy = "popularity",
} = {}) {
  const queryParams = [];

  if (page > 1) {
    queryParams.push(`page=${page}`);
  }

  // Language filter
  if (language && language !== "all") {
    const langEnum = LANGUAGE_MAP[language.toLowerCase()];
    if (langEnum) {
      queryParams.push(`Show[language_enum]=${langEnum}`);
    }
  }

  // Country filter
  if (country) {
    let countryEnum = COUNTRY_MAP[country.toLowerCase()];
    if (!countryEnum) {
      const fullCountryName = COUNTRY_CODE_TO_NAME[country.toUpperCase()];
      if (fullCountryName) {
        countryEnum = COUNTRY_MAP[fullCountryName.toLowerCase()];
      }
    }
    if (countryEnum) {
      queryParams.push(`Show[country_enum]=${countryEnum}`);
    }
  }

  // Status filter
  if (showStatus) {
    const statusEnum = STATUS_MAP[showStatus.toLowerCase()];
    if (statusEnum) {
      queryParams.push(`Show[showStatus_enum]=${statusEnum}`);
    }
  }

  // Show Type filter
  if (showType) {
    const typeEnum = TYPE_MAP[showType.toLowerCase()];
    if (typeEnum) {
      queryParams.push(`Show[showType_enum]=${typeEnum}`);
    }
  }

  // Genre filter
  if (genre) {
    const genreEnum = GENRE_MAP[genre.toLowerCase()];
    if (genreEnum) {
      queryParams.push(`Show[genre]=${genreEnum}`);
    }
  }

  // Sort filter
  if (sortBy && SORT_MAP[sortBy]) {
    queryParams.push(`Show[sort]=${SORT_MAP[sortBy]}`);
  }

  const queryString = queryParams.join("&");
  const url = `${TVMAZE_WEB_BASE}/shows${queryString ? `?${queryString}` : ""}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return { results: [], total_pages: 1 };
    }

    const html = await res.text();

    // Parse show cards from HTML
    const cardRegex =
      /<div class="column column-block" data-key="(\d+)">([\s\S]*?)<\/div>\s*<\/div>/g;
    let match;
    const cards = [];

    while ((match = cardRegex.exec(html)) !== null) {
      const key = match[1];
      const cardHtml = match[2];

      const titleMatch = cardHtml.match(
        /<span class="title"><h2><a href="[^"]*">([^<]*)<\/a>/
      );
      const imgMatch = cardHtml.match(/<img src="([^"]*)"/);
      const rateMatch = cardHtml.match(/<b itemprop="ratingValue">([^<]*)<\/b>/);

      let posterSrc = imgMatch ? imgMatch[1] : "/fallbackImg.png";
      if (posterSrc.startsWith("//")) {
        posterSrc = `https:${posterSrc}`;
      } else if (posterSrc.startsWith("/")) {
        posterSrc = `https://static.tvmaze.com${posterSrc}`;
      }

      const title = titleMatch
        ? titleMatch[1].replace(/&#039;/g, "'").replace(/&amp;/g, "&")
        : "Untitled";
      const rating = rateMatch ? parseFloat(rateMatch[1]) : null;

      cards.push(
        normalizeShow({
          id: Number(key),
          name: title,
          title: title,
          posterSrc: posterSrc,
          poster_path: posterSrc,
          rating: rating,
          vote_average: rating,
          type: showType || "Scripted",
          language: language || null,
          status: showStatus || null,
        })
      );
    }

    // Determine exact total pages from pagination markup
    let totalPages = page;
    const paginationMatch = html.match(/<ul class="pagination"[\s\S]*?<\/ul>/);
    if (paginationMatch) {
      const pageNumbers = Array.from(
        paginationMatch[0].matchAll(/data-page="(\d+)"/g),
        (m) => Number(m[1]) + 1
      );
      if (pageNumbers.length > 0) {
        totalPages = Math.max(...pageNumbers);
      }
    } else {
      totalPages = 1;
    }

    return {
      results: cards,
      total_pages: Math.max(totalPages, 1),
    };
  } catch (error) {
    console.error("TVmaze web filter error:", error);
    return { results: [], total_pages: 1 };
  }
}

/**
 * Universal getShows router:
 * 1. If user entered search query: uses TVmaze search API (/search/shows?q=)
 * 2. If user selected any filters (language, country, status, type, genre, sort) or browsing:
 *    uses TVmaze official web filter engine (1-to-1 official website match!)
 */
export async function getShows({
  page = 1,
  query = "",
  genres = [],
  language = "",
  status = "",
  showType = "",
  country = "",
  sortBy = "popularity",
} = {}) {
  // 1. Explicit search query
  if (query && query.trim()) {
    const searchRes = await searchShows(query);
    const filtered = filterAndSort(searchRes.results, {
      genres,
      language,
      status,
      showType,
      country,
      sortBy,
    });
    return { results: filtered, total_pages: 1 };
  }

  // 2. Filtered or sorted browsing (matches official website 1-to-1)
  const singleGenre = genres.length > 0 ? genres[0] : "";
  return await fetchWebFilteredShows({
    page,
    language,
    country,
    showStatus: status,
    showType,
    genre: singleGenre,
    sortBy,
  });
}

// --- Static Data Helpers for Dropdowns ---

export function getGenres() {
  return tvmazeEnumsData.genres.map(([, name]) => name);
}

export function getLanguages() {
  return tvmazeEnumsData.languages.map(([, name]) => name);
}

export function getShowStatuses() {
  return tvmazeEnumsData.statuses.map(([, name]) => name);
}

export function getShowTypes() {
  return tvmazeEnumsData.types.map(([, name]) => name);
}

export function getCountries() {
  // Return code and name mapping
  const countryList = [];
  const addedCodes = new Set();

  for (const [code, name] of Object.entries(COUNTRY_CODE_TO_NAME)) {
    countryList.push({ code, name });
    addedCodes.add(code);
  }

  // Also append any remaining from enums
  for (const [, name] of tvmazeEnumsData.countries) {
    if (!countryList.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      countryList.push({ code: name.slice(0, 2).toUpperCase(), name });
    }
  }

  return countryList.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * In-memory fallback filter and sort.
 */
export function filterAndSort(shows, filters = {}) {
  let filtered = [...shows];

  if (filters.genres && filters.genres.length > 0) {
    filtered = filtered.filter((show) =>
      filters.genres.some((g) => show.genres?.includes(g))
    );
  }

  if (filters.language && filters.language !== "all") {
    filtered = filtered.filter(
      (show) => show.language?.toLowerCase() === filters.language.toLowerCase()
    );
  }

  if (filters.status) {
    filtered = filtered.filter((show) => show.status === filters.status);
  }

  if (filters.showType) {
    filtered = filtered.filter((show) => show.showType === filters.showType);
  }

  if (filters.country) {
    const target = filters.country.toLowerCase();
    filtered = filtered.filter((show) => {
      const netCode = show.network?.country?.toLowerCase();
      const netName = show.network?.countryName?.toLowerCase();
      const webCode = show.webChannel?.country?.toLowerCase();
      const webName = show.webChannel?.countryName?.toLowerCase();

      return (
        netCode === target ||
        netName === target ||
        webCode === target ||
        webName === target
      );
    });
  }

  filtered = filtered.filter(
    (show) => show.posterSrc && show.posterSrc !== "/fallbackImg.png"
  );

  switch (filters.sortBy) {
    case "rating":
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case "name":
      filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      break;
    case "newest":
      filtered.sort(
        (a, b) =>
          new Date(b.first_air_date || 0) - new Date(a.first_air_date || 0)
      );
      break;
    case "popularity":
    default:
      filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      break;
  }

  return filtered;
}
