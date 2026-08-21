const OMDB_API_KEY = process.env.OMDB_API_KEY || "7dcf5808";
const OMDB_BASE_URL = "http://www.omdbapi.com/";

/**
 * Normalize an OMDb item (from search or detail call) into the MMC standard format.
 */
export function normalizeOmdbItem(item) {
  if (!item) return null;

  const ratings = Array.isArray(item.Ratings) ? item.Ratings : [];
  const rottenTomatoesObj = ratings.find((r) => r.Source === "Rotten Tomatoes");
  const metacriticObj = ratings.find((r) => r.Source === "Metacritic");
  const imdbObj = ratings.find((r) => r.Source === "Internet Movie Database");

  const isSeries = item.Type === "series";

  return {
    id: item.imdbID || item.id,
    imdbID: item.imdbID || item.id,
    title: item.Title || "Untitled",
    release_date: item.Year !== "N/A" ? item.Year : (item.Released !== "N/A" ? item.Released : null),
    year: item.Year !== "N/A" ? item.Year : null,
    poster_path: item.Poster && item.Poster !== "N/A" ? item.Poster : null,
    posterSrc: item.Poster && item.Poster !== "N/A" ? item.Poster : null,
    overview: item.Plot && item.Plot !== "N/A" ? item.Plot : "",
    mediaType: isSeries ? "tv" : "movie",
    type: item.Type || "movie",
    showType: isSeries ? "TV Series" : "Movie",
    rating: parseFloat(item.imdbRating) || (imdbObj ? parseFloat(imdbObj.Value) : null),
    imdbRating: item.imdbRating !== "N/A" ? item.imdbRating : null,
    imdbVotes: item.imdbVotes !== "N/A" ? item.imdbVotes : null,
    rottenTomatoes: rottenTomatoesObj ? rottenTomatoesObj.Value : null,
    metacritic: metacriticObj ? metacriticObj.Value : (item.Metascore && item.Metascore !== "N/A" ? `${item.Metascore}/100` : null),
    awards: item.Awards && item.Awards !== "N/A" ? item.Awards : null,
    boxOffice: item.BoxOffice && item.BoxOffice !== "N/A" ? item.BoxOffice : null,
    rated: item.Rated && item.Rated !== "N/A" ? item.Rated : null,
    director: item.Director && item.Director !== "N/A" ? item.Director : null,
    writer: item.Writer && item.Writer !== "N/A" ? item.Writer : null,
    actors: item.Actors && item.Actors !== "N/A" ? item.Actors : null,
    genre: item.Genre && item.Genre !== "N/A" ? item.Genre : null,
    language: item.Language && item.Language !== "N/A" ? item.Language : null,
    country: item.Country && item.Country !== "N/A" ? item.Country : null,
    runtime: item.Runtime && item.Runtime !== "N/A" ? item.Runtime : null,
  };
}

/**
 * Search OMDb media by title query or direct IMDb ID (ttXXXXXXX)
 */
export async function searchMedia({ query = "", imdbId = "", type = "", year = "", page = 1 } = {}) {
  try {
    const cleanImdbId = imdbId || (query.trim().startsWith("tt") && /^\d+$/.test(query.trim().slice(2)) ? query.trim() : "");

    // 1. Direct IMDb ID Lookup
    if (cleanImdbId) {
      const url = `${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&i=${encodeURIComponent(cleanImdbId)}&plot=full`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return { results: [], page: 1, totalPages: 1 };
      const data = await res.json();
      if (data.Response === "False" || !data.imdbID) {
        return { results: [], page: 1, totalPages: 1 };
      }
      const normalized = normalizeOmdbItem(data);
      return { results: [normalized], page: 1, totalPages: 1 };
    }

    // 2. Title Search
    const searchQuery = query.trim();
    if (!searchQuery) return { results: [], page: 1, totalPages: 1 };
    let url = `${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(searchQuery)}&page=${page}`;
    if (type && type !== "all") url += `&type=${encodeURIComponent(type)}`;
    if (year) url += `&y=${encodeURIComponent(year)}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { results: [], page: 1, totalPages: 1 };
    const data = await res.json();

    if (data.Response === "False" || !data.Search) {
      return { results: [], page: 1, totalPages: 1 };
    }

    const totalResults = parseInt(data.totalResults, 10) || data.Search.length;
    const totalPages = Math.min(Math.ceil(totalResults / 10), 100);

    const normalizedResults = data.Search.map((item) => normalizeOmdbItem(item));

    return {
      results: normalizedResults,
      page: Number(page),
      totalPages,
      totalResults,
    };
  } catch (error) {
    console.error("OMDb Search Error:", error);
    return { results: [], page: 1, totalPages: 1 };
  }
}

/**
 * Fetch detailed record for a specific movie or show by IMDb ID or Title
 */
export async function getMediaDetails({ imdbId = "", title = "", year = "", plot = "full" } = {}) {
  try {
    let url = `${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&plot=${plot}`;
    if (imdbId) {
      url += `&i=${encodeURIComponent(imdbId)}`;
    } else if (title) {
      url += `&t=${encodeURIComponent(title)}`;
      if (year) url += `&y=${encodeURIComponent(year)}`;
    } else {
      return null;
    }

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.Response === "False") return null;

    return normalizeOmdbItem(data);
  } catch (error) {
    console.error("OMDb Details Fetch Error:", error);
    return null;
  }
}

export function getOmdbMediaTypes() {
  return [
    { value: "", label: "All Types" },
    { value: "movie", label: "Movies" },
    { value: "series", label: "TV Series" },
  ];
}

export function getOmdbSortOptions() {
  return [
    { value: "relevance", label: "Relevance" },
    { value: "year_desc", label: "Newest First" },
    { value: "year_asc", label: "Oldest First" },
  ];
}
