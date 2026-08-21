import { getMediaById as anilistGetById } from "./anilistAdapter.js";
import { getTitleDetails as watchmodeGetById } from "./watchmodeAdapter.js";
import { getMediaDetails as omdbGetById } from "./omdbAdapter.js";

const TMDB_API_KEY = process.env.TMDB_API_KEY || "3472ccb0d97ebc192cbd0e56bd799736";
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:5000";

function getApiUrl(subpath) {
  const cleanPath = subpath.startsWith("/api/")
    ? subpath.replace(/^\/api/, "")
    : subpath.startsWith("/")
      ? subpath
      : `/${subpath}`;
  const base = BACKEND_URL.replace(/\/$/, "");
  return base.endsWith("/api") ? `${base}${cleanPath}` : `${base}${cleanPath}`;
}

export async function resolveMediaDetails(storedId) {
  if (!storedId) return null;

  try {
    // 1. Custom Movie: "custom:60a8b..."
    if (storedId.startsWith("custom:")) {
      const id = storedId.replace(/^custom:/, "");
      const res = await fetch(getApiUrl(`/custom-movie/${id}`), { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      const custom = data.data;
      if (!custom) return null;
      return {
        id: custom._id,
        storedId: `custom:${custom._id}`,
        title: custom.title,
        poster_path: custom.poster_path,
        posterSrc: custom.poster_path || "/fallbackImg.png",
        overview: custom.overview,
        mediaType: custom.mediaType || "movie",
        isCustom: true,
      };
    }

    // 2. TVmaze: "tvmaze:tv:169" or "tvmaze:169"
    if (storedId.startsWith("tvmaze:")) {
      const parts = storedId.split(":");
      const id = parts[2] || parts[1];
      const res = await fetch(`https://api.tvmaze.com/shows/${id}`, { next: { revalidate: 86400 } });
      if (!res.ok) return null;
      const show = await res.json();
      const summaryClean = show.summary
        ? show.summary.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
        : "";
      return {
        id: show.id,
        storedId: `tvmaze:tv:${show.id}`,
        title: show.name,
        name: show.name,
        poster_path: show.image?.medium || show.image?.original || null,
        posterSrc: show.image?.medium || show.image?.original || "/fallbackImg.png",
        overview: summaryClean,
        mediaType: "tv",
        provider: "tvmaze",
        rating: show.rating?.average || null,
        showType: show.type || null,
        first_air_date: show.premiered || null,
      };
    }

    // 3. AniList: "anilist:tv:16498", "anilist:manga:30013", "anilist:anime:16498", "anilist:16498"
    if (storedId.startsWith("anilist:")) {
      const parts = storedId.split(":");
      const id = parts[2] || parts[1];
      const item = await anilistGetById(id);
      if (!item) return null;
      return {
        ...item,
        storedId,
        provider: "anilist",
      };
    }

    // 4. Watchmode: "watchmode:movie:3173903", "watchmode:tv:3257076", "watchmode:3173903"
    if (storedId.startsWith("watchmode:")) {
      const parts = storedId.split(":");
      const id = parts[2] || parts[1];
      const item = await watchmodeGetById(id);
      if (!item) return null;
      return {
        ...item,
        storedId,
        provider: "watchmode",
      };
    }

    // 5. OMDb: "omdb:movie:tt1375666", "omdb:tv:tt0903747", "omdb:tt1375666", or bare "tt1375666"
    if (storedId.startsWith("omdb:") || storedId.startsWith("tt")) {
      const imdbId = storedId.startsWith("omdb:")
        ? storedId.split(":")[storedId.split(":").length - 1]
        : storedId;
      const item = await omdbGetById({ imdbId });
      if (!item) return null;
      return {
        ...item,
        storedId: `omdb:${item.mediaType || "movie"}:${item.id}`,
        provider: "omdb",
      };
    }

    // 6. TMDB Movie / TV: "movie:550", "tv:1396", or bare numeric "550"
    let type = "movie";
    let id = storedId;
    if (storedId.includes(":")) {
      [type, id] = storedId.split(":");
    }
    const res = await fetch(
      `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      ...data,
      mediaType: type,
      storedId: `${type}:${id}`,
      provider: "tmdb",
    };
  } catch (error) {
    console.error("resolveMediaDetails error for", storedId, error);
    return null;
  }
}
