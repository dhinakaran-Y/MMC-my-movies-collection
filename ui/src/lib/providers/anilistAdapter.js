/**
 * AniList API Adapter (GraphQL)
 * Anime & Manga Database
 * Endpoint: https://graphql.anilist.co
 */

import anilistEnums from "@/data/anilistEnums.json";

const ANILIST_GRAPHQL_ENDPOINT = "https://graphql.anilist.co";

let cachedGenres = null;
let cachedTags = null;

/**
 * Helper to execute a GraphQL query against AniList
 */
async function fetchGraphQL(query, variables = {}, revalidateSeconds = 1800) {
  try {
    const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: revalidateSeconds },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "No response body");
      console.warn(`[AniList API] Service status ${res.status}:`, errText);
      return null;
    }

    const json = await res.json();
    if (json.errors) {
      console.warn("[AniList API] GraphQL response errors:", json.errors);
    }
    return json.data || null;
  } catch (error) {
    console.warn("[AniList API] Fetch error:", error.message || error);
    return null;
  }
}

/**
 * Normalize an AniList result item into MMC's unified media shape.
 */
export function normalizeMedia(item) {
  if (!item) return null;

  const isAnime = item.type !== "MANGA";
  const rawId = item.id;
  const mediaType = isAnime ? "tv" : "manga";

  const englishTitle = item.title?.english;
  const romajiTitle = item.title?.romaji;
  const nativeTitle = item.title?.native;
  const displayTitle = englishTitle || romajiTitle || nativeTitle || "Untitled";

  const posterPath = item.coverImage?.large || item.coverImage?.medium || null;
  const posterSrc = posterPath || "/fallbackImg.png";
  const backdropPath = item.bannerImage || null;

  // Format description overview (strip HTML tags)
  const rawOverview = item.description || "";
  const overview = rawOverview.replace(/<[^>]*>?/gm, "").trim();

  // Normalize scores (AniList averageScore is 0-100, convert to 0-10 for MMC rating)
  const voteAverage =
    typeof item.averageScore === "number" ? item.averageScore / 10 : null;

  // Format release date
  let releaseDate = null;
  if (item.startDate?.year) {
    const y = item.startDate.year;
    const m = String(item.startDate.month || 1).padStart(2, "0");
    const d = String(item.startDate.day || 1).padStart(2, "0");
    releaseDate = `${y}-${m}-${d}`;
  } else if (item.seasonYear) {
    releaseDate = `${item.seasonYear}-01-01`;
  }

  // Extract main studio if available
  const mainStudio = item.studios?.nodes?.[0]?.name || null;

  // Extract streaming links
  const streamingLinks = (item.externalLinks || [])
    .filter((link) => link.type === "STREAMING")
    .map((link) => ({
      provider_name: link.site,
      web_url: link.url,
    }));

  return {
    id: rawId,
    anilistId: rawId,
    provider: "anilist",
    mediaType: mediaType,
    storedId: `anilist:${isAnime ? "anime" : "manga"}:${rawId}`,
    compositeId: `anilist:${isAnime ? "anime" : "manga"}:${rawId}`,

    title: displayTitle,
    name: displayTitle,
    overview:
      overview ||
      `Released in ${item.seasonYear || item.startDate?.year || "N/A"} (${item.format || (isAnime ? "Anime" : "Manga")})`,

    poster_path: posterPath,
    posterSrc: posterSrc,
    backdrop_path: backdropPath,

    release_date: releaseDate,
    first_air_date: releaseDate,
    year: item.seasonYear || item.startDate?.year || null,

    vote_average: voteAverage,
    rating: voteAverage,
    averageScore: item.averageScore || null,
    popularity: item.popularity || 0,
    favourites: item.favourites || 0,
    trending: item.trending || 0,

    genres: item.genres || [],
    tags: (item.tags || []).map((t) => t.name),

    // AniList specific attributes
    format: item.format || null,
    status: item.status || null,
    season: item.season ? `${item.season} ${item.seasonYear || ""}`.trim() : null,
    episodes: item.episodes || null,
    duration: item.duration || null,
    chapters: item.chapters || null,
    volumes: item.volumes || null,
    source: item.source ? item.source.replace("_", " ") : null,
    countryOfOrigin: item.countryOfOrigin || null,
    studio: mainStudio,
    streamingLinks: streamingLinks,
    _raw: item,
  };
}

const MEDIA_FIELDS = `
  id
  type
  title { romaji english native }
  coverImage { large medium color }
  bannerImage
  format
  status
  season
  seasonYear
  episodes
  duration
  chapters
  volumes
  genres
  tags { name rank }
  averageScore
  popularity
  trending
  favourites
  source
  countryOfOrigin
  studios(isMain: true) { nodes { name } }
  externalLinks { site url type }
  description(asHtml: false)
  startDate { year month day }
`;

const BROWSE_QUERY = `
  query (
    $page: Int,
    $perPage: Int,
    $type: MediaType,
    $sort: [MediaSort],
    $search: String,
    $genre_in: [String],
    $tag_in: [String],
    $season: MediaSeason,
    $seasonYear: Int,
    $format_in: [MediaFormat],
    $status: MediaStatus,
    $source: MediaSource,
    $countryOfOrigin: CountryCode,
    $licensedBy_in: [String],
    $startDate_greater: FuzzyDateInt,
    $startDate_lesser: FuzzyDateInt,
    $episodes_greater: Int,
    $episodes_lesser: Int,
    $duration_greater: Int,
    $duration_lesser: Int,
    $isAdult: Boolean
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
        perPage
      }
      media(
        type: $type,
        sort: $sort,
        search: $search,
        genre_in: $genre_in,
        tag_in: $tag_in,
        season: $season,
        seasonYear: $seasonYear,
        format_in: $format_in,
        status: $status,
        source: $source,
        countryOfOrigin: $countryOfOrigin,
        licensedBy_in: $licensedBy_in,
        startDate_greater: $startDate_greater,
        startDate_lesser: $startDate_lesser,
        episodes_greater: $episodes_greater,
        episodes_lesser: $episodes_lesser,
        duration_greater: $duration_greater,
        duration_lesser: $duration_lesser,
        isAdult: $isAdult
      ) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

/**
 * Discover/browse AniList media with rich filters
 */
export async function browseMedia(params = {}) {
  const page = Number(params.page) || 1;
  const perPage = 24;

  const type = (params.type || "ANIME").toUpperCase() === "MANGA" ? "MANGA" : "ANIME";
  const sort = params.sortBy ? [params.sortBy] : ["POPULARITY_DESC"];

  const variables = {
    page,
    perPage,
    type,
    sort,
    isAdult: false,
  };

  if (params.query?.trim()) {
    variables.search = params.query.trim();
    variables.sort = ["SEARCH_MATCH"];
  }

  // Genres
  if (params.genre) {
    const genreList = Array.isArray(params.genre)
      ? params.genre
      : params.genre.split(",").map((g) => g.trim()).filter(Boolean);
    if (genreList.length > 0) variables.genre_in = genreList;
  }

  // Tags
  if (params.tag) {
    const tagList = Array.isArray(params.tag)
      ? params.tag
      : params.tag.split(",").map((t) => t.trim()).filter(Boolean);
    if (tagList.length > 0) variables.tag_in = tagList;
  }

  // Season & Season Year
  if (params.season) {
    variables.season = params.season.toUpperCase();
  }
  if (params.seasonYear) {
    variables.seasonYear = Number(params.seasonYear);
  }

  // Format
  if (params.format) {
    const formatList = Array.isArray(params.format)
      ? params.format
      : params.format.split(",").map((f) => f.trim().toUpperCase()).filter(Boolean);
    if (formatList.length > 0) variables.format_in = formatList;
  }

  // Status
  if (params.status) {
    variables.status = params.status.toUpperCase();
  }

  // Source Material
  if (params.source) {
    variables.source = params.source.toUpperCase();
  }

  // Country of Origin
  if (params.country) {
    variables.countryOfOrigin = params.country.toUpperCase();
  }

  // Streaming Services (licensedBy_in)
  if (params.streamingOn) {
    const serviceList = Array.isArray(params.streamingOn)
      ? params.streamingOn
      : params.streamingOn.split(",").map((s) => s.trim()).filter(Boolean);
    if (serviceList.length > 0) variables.licensedBy_in = serviceList;
  }

  // Year Range (FuzzyDateInt YYYY0000)
  if (params.yearStart) {
    variables.startDate_greater = Number(`${params.yearStart}0000`);
  }
  if (params.yearEnd) {
    variables.startDate_lesser = Number(`${params.yearEnd}1231`);
  }

  // Episodes Range
  if (params.episodesMin) {
    variables.episodes_greater = Number(params.episodesMin) - 1;
  }
  if (params.episodesMax) {
    variables.episodes_lesser = Number(params.episodesMax) + 1;
  }

  // Duration Range
  if (params.durationMin) {
    variables.duration_greater = Number(params.durationMin) - 1;
  }
  if (params.durationMax) {
    variables.duration_lesser = Number(params.durationMax) + 1;
  }

  const data = await fetchGraphQL(BROWSE_QUERY, variables);
  if (!data || !data.Page) {
    return { results: [], total_pages: 1, total_results: 0, page: 1 };
  }

  const pageInfo = data.Page.pageInfo || {};
  const mediaList = data.Page.media || [];
  const results = mediaList.map(normalizeMedia).filter(Boolean);

  return {
    results,
    total_pages: Math.min(pageInfo.lastPage || 1, 500),
    total_results: pageInfo.total || 0,
    page: pageInfo.currentPage || page,
  };
}

/**
 * Search AniList media by title
 */
export async function searchMedia(query, page = 1, type = "ANIME") {
  return await browseMedia({
    query,
    page,
    type,
  });
}

/**
 * Helper to calculate current/next anime season
 */
export function getAnimeSeasons() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  let currentSeason = "WINTER";
  let currentYear = year;
  let nextSeason = "SPRING";
  let nextYear = year;

  if (month >= 1 && month <= 3) {
    currentSeason = "WINTER";
    nextSeason = "SPRING";
  } else if (month >= 4 && month <= 6) {
    currentSeason = "SPRING";
    nextSeason = "SUMMER";
  } else if (month >= 7 && month <= 9) {
    currentSeason = "SUMMER";
    nextSeason = "FALL";
  } else {
    currentSeason = "FALL";
    nextSeason = "WINTER";
    nextYear = year + 1;
  }

  return { currentSeason, currentYear, nextSeason, nextYear };
}

/**
 * Get 5 curated rows for the AniList homepage
 * 1. Trending Now
 * 2. Popular This Season
 * 3. Upcoming Next Season
 * 4. All Time Popular
 * 5. Top 100
 */
export async function getCuratedRows(type = "ANIME") {
  const mediaType = (type || "ANIME").toUpperCase() === "MANGA" ? "MANGA" : "ANIME";
  const { currentSeason, currentYear, nextSeason, nextYear } = getAnimeSeasons();

  const [trending, popularSeason, upcomingNext, allTimePopular, top100] =
    await Promise.all([
      // 1. Trending Now
      browseMedia({ type: mediaType, sortBy: "TRENDING_DESC", page: 1 }),
      // 2. Popular This Season (for anime) or Top Rated (for manga)
      mediaType === "ANIME"
        ? browseMedia({
            type: mediaType,
            sortBy: "POPULARITY_DESC",
            season: currentSeason,
            seasonYear: currentYear,
            page: 1,
          })
        : browseMedia({ type: mediaType, sortBy: "SCORE_DESC", page: 1 }),
      // 3. Upcoming Next Season (for anime) or Releasing Manga
      mediaType === "ANIME"
        ? browseMedia({
            type: mediaType,
            sortBy: "POPULARITY_DESC",
            season: nextSeason,
            seasonYear: nextYear,
            status: "NOT_YET_RELEASED",
            page: 1,
          })
        : browseMedia({
            type: mediaType,
            sortBy: "POPULARITY_DESC",
            status: "RELEASING",
            page: 1,
          }),
      // 4. All Time Popular
      browseMedia({ type: mediaType, sortBy: "POPULARITY_DESC", page: 1 }),
      // 5. Top 100 (Highest Score)
      browseMedia({ type: mediaType, sortBy: "SCORE_DESC", page: 1 }),
    ]);

  return {
    trendingNow: trending.results || [],
    popularThisSeason: popularSeason.results || [],
    upcomingNextSeason: upcomingNext.results || [],
    allTimePopular: allTimePopular.results || [],
    top100: (top100.results || []).slice(0, 10),
    seasonInfo: { currentSeason, currentYear, nextSeason, nextYear },
  };
}

/**
 * Get all available genres from AniList
 */
export async function getGenres() {
  if (cachedGenres) return cachedGenres;

  const query = `{ GenreCollection }`;
  const data = await fetchGraphQL(query, {}, 86400);

  if (data && Array.isArray(data.GenreCollection)) {
    // Filter out adult genres (Hentai)
    cachedGenres = data.GenreCollection.filter((g) => g !== "Hentai").map((name) => ({
      id: name,
      name,
    }));
    return cachedGenres;
  }

  // Static fallback if API fails
  return [
    "Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy",
    "Horror", "Mahou Shoujo", "Mecha", "Music", "Mystery",
    "Psychological", "Romance", "Sci-Fi", "Slice of Life",
    "Sports", "Supernatural", "Thriller",
  ].map((name) => ({ id: name, name }));
}

/**
 * Get all tags grouped by category from AniList
 */
export async function getTags() {
  if (cachedTags) return cachedTags;

  const query = `{
    MediaTagCollection {
      id
      name
      category
      isAdult
    }
  }`;

  const data = await fetchGraphQL(query, {}, 86400);
  if (data && Array.isArray(data.MediaTagCollection)) {
    const rawTags = data.MediaTagCollection.filter((t) => !t.isAdult);
    const categoryMap = {};

    for (const tag of rawTags) {
      const cat = tag.category || "Other";
      if (!categoryMap[cat]) categoryMap[cat] = [];
      categoryMap[cat].push(tag.name);
    }

    cachedTags = Object.keys(categoryMap)
      .sort()
      .map((category) => ({
        category,
        tags: categoryMap[category].sort(),
      }));

    return cachedTags;
  }

  return [];
}

export const getMediaTypes = () => anilistEnums.mediaTypes;
export const getAnimeCategories = () => anilistEnums.animeCategories;
export const getMangaCategories = () => anilistEnums.mangaCategories;
export const getAnimeFormats = () => anilistEnums.animeFormats;
export const getMangaFormats = () => anilistEnums.mangaFormats;
export const getAiringStatuses = () => anilistEnums.airingStatuses;
export const getPublishingStatuses = () => anilistEnums.publishingStatuses;
export const getSeasons = () => anilistEnums.seasons;
export const getSources = () => anilistEnums.sources;
export const getCountries = () => anilistEnums.countries;
export const getSortOptions = () => anilistEnums.sortOptions;
export const getStreamingServices = () => anilistEnums.streamingServices;

/**
 * Fetch a single anime or manga by AniList ID
 */
export async function getMediaById(id) {
  if (!id) return null;
  const query = `
    query ($id: Int) {
      Media(id: $id) {
        ${MEDIA_FIELDS}
      }
    }
  `;
  const data = await fetchGraphQL(query, { id: Number(id) });
  if (!data || !data.Media) return null;
  return normalizeMedia(data.Media);
}
