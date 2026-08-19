import ShareButton from "@/components/CollectionComponents/ShareBtn";
import WatchListCollectionGrid from "./watchListCollectionGrid";
import { cookies } from "next/headers";

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

export async function generateMetadata() {
  return {
    title: `WatchList | MovieCollection`,
    description: `A users' watched movies list collection`,
  };
}

// ── Fetch single media (movie or tv) details ─────────────────────
async function getMediaDetails(storedId) {
  try {
    let type = "movie";
    let id = storedId;
    if (typeof storedId === "string" && storedId.includes(":")) {
      const parts = storedId.split(":");
      if (parts[0] === "tvmaze") {
        type = "tvmaze";
        id = parts[2] || parts[1];
      } else {
        [type, id] = parts;
      }
    }

    // Handle Custom Movie
    if (type === "custom") {
      const res = await fetch(getApiUrl(`/custom-movie/${id}`), {
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = await res.json();
      const custom = data.data;
      if (!custom) return null;
      return {
        id: custom._id,
        storedId: `custom:${custom._id}`,
        title: custom.title,
        poster_path: custom.poster_path,
        overview: custom.overview,
        mediaType: custom.mediaType || "movie",
        isCustom: true,
      };
    }

    // Handle TVmaze Show
    if (type === "tvmaze") {
      const res = await fetch(`https://api.tvmaze.com/shows/${id}`, {
        next: { revalidate: 86400 },
      });
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

    // Handle TMDB Movie/TV
    const res = await fetch(
      `https://api.themoviedb.org/3/${type}/${id}?api_key=${process.env.TMDB_API_KEY}`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      ...data,
      mediaType: type,
      storedId: storedId,
    };
  } catch {
    return null;
  }
}

// ── Extracted fetcher — pure data, no JSX ─────────────────────────────────
async function getWatchListData(userId, token) {
  try {
    const res = await fetch(getApiUrl(`/watch-list/${userId}`), {
      cache: "no-store",
      headers: {
        Cookie: `token=${token}`,
      },
    });

    if (!res.ok) return { error: res.status };

    const data = await res.json();
    return { data };
  } catch (err) {
    console.error("getWatchListData error:", err);
    return { error: 500 };
  }
}

export default async function WatchListPage({ params }) {
  const { userId } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // ── All data fetching done outside JSX ─────────────────────────────────
  const { data, error } = await getWatchListData(userId, token);

  // ── Error state — JSX safely outside try/catch ─────────────────────────
  if (error) {
    return (
      <div className="text-white text-center mt-[30vh]">
        {error === 401
          ? "Please log in to view your watchlist."
          : "Failed to load list."}
      </div>
    );
  }

  const moviesIds = data.movies || [];

  const movieResults = await Promise.allSettled(
    moviesIds.map((id) => getMediaDetails(id)),
  );

  const validMovies = movieResults
    .filter((res) => res.status === "fulfilled" && res.value !== null)
    .map((res) => res.value);

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 min-h-screen">
      {/* share btn*/}
      {/* <div className="float-end">
        <ShareButton
          title={"WatchList"}
          text={`Check out my movie collection: ${"WatchList"}`}
        />
      </div> */}
      {/* header */}
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-bold text-white tracking-tight">
          <span className="text-brand">My Watched List</span>
        </h2>
        <p className="text-slate-400 mt-2 font-medium">
          {validMovies.length > 0
            ? `You have watched ${validMovies.length} items`
            : "Your watchList is empty."}
        </p>
      </div>

      {validMovies.length > 0 ? (
        <WatchListCollectionGrid moviesList={validMovies} />
      ) : (
        <div className="text-center text-slate-500">
          Add some movies to your watchlist to see them here!
        </div>
      )}
    </section>
  );
}
