import ShareButton from "@/components/CollectionComponents/ShareBtn";
import WatchListCollectionGrid from "./watchListCollectionGrid";
import { cookies } from "next/headers";

const APP_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata() {
  return {
    title: `WatchList | MovieCollection`,
    description: `A users' watched movies list collection`,
  };
}

// ── Fetch single movie details from TMDB ───────────────────────────────────
async function getMovieDetails(movieId) {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Extracted fetcher — pure data, no JSX ─────────────────────────────────
async function getWatchListData(userId, token) {
  try {
    const res = await fetch(
      new URL(`/api/watch-list/${userId}`, APP_BASE_URL).toString(),
      {
        cache: "no-store",
        headers: {
          Cookie: `token=${token}`,
        },
      },
    );

    if (!res.ok) return { error: res.status };

    const data = await res.json();
    return { data };
  } catch {
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
    moviesIds.map((id) => getMovieDetails(id)),
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
          <span className="text-brand">My Watched Movies</span>
        </h2>
        <p className="text-slate-400 mt-2 font-medium">
          {validMovies.length > 0
            ? `You have watched ${validMovies.length} movies`
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
