import WatchListCollectionGrid from "./watchListCollectionGrid";
import { cookies } from 'next/headers';

export async function generateMetadata({ params }) {
  return {
    title: `WatchList | MovieCollection`,
    description: `A users' watched movies list collection`,
  };
}

// Helper to fetch details from TMDB
async function getMovieDetails(movieId) {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}`,
    );
    return await res.json();
  } catch (error) {
    return null; // Return null if a specific movie fetch fails
  }
}

export default async function WatchListPage({ params }) {
  const { userId } = await params;

  // 2. Get the cookies from the incoming request
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // 1. Fetch the list of movie IDs from your Express backend
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/watch-list/${userId}`,
    {
      headers: {
        Cookie: `token=${token}`, // Pass the token manually
      },
      cache: "no-store",
    },
  );

  if (!res.ok)
    return (
      <div className="text-white text-center mt-[30vh]">
        Failed to load list.
      </div>
    );

  const data = await res.json();
  console.log(res, data);
  const moviesIds = data.movies || [];

  // 2. Fetch full movie details for every ID from TMDB
  const moviesList =
    moviesIds.length > 0
      ? await Promise.allSettled(moviesIds.map((id) => getMovieDetails(id)))
      : [];

  // Filter out any nulls if a TMDB fetch failed
  const validMovies = moviesList
    .filter((res) => res.status === "fulfilled" && res.value !== null)
    .map((res) => res.value);

  console.log("get watched list", moviesIds, moviesList, validMovies);
  return (
    <section className="max-w-7xl mx-auto px-6 py-16 min-h-screen">
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
