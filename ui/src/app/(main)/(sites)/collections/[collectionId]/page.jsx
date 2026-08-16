import Link from "next/link";
import SingleCollectionPageGrid from "./SingleCollectionPageGrid";
import ShareButton from "@/components/CollectionComponents/ShareBtn";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

const APP_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata({ params }) {
  const { collectionId } = await params;

  try {
    const res = await fetch(
      new URL(`/api/collection/${collectionId}`, APP_BASE_URL).toString(),
      { cache: "no-store" },
    );

    if (!res.ok) return { title: "Collection | MovieCollection" };

    const data = await res.json();
    const name = data.data?.collectionName || "Collection";

    return {
      title: `${name} | MovieCollection`,
      description: `Browse the ${name} movie collection.`,
    };
  } catch {
    return { title: "Collection | MovieCollection" };
  }
}

async function getMovieDetails(movieId) {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Extracted fetcher — no JSX, just data 
async function verifyToken(token) {
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const verified = await jwtVerify(token, secret);
    return verified?.payload || null;
  } catch {
    return null;
  }
}

async function getCollectionData(collectionId, cookieString) {
  try {
    const colRes = await fetch(
      new URL(`/api/collection/${collectionId}`, APP_BASE_URL).toString(),
      {
        method: "GET",
        cache: "no-store",
        headers: { Cookie: cookieString },
      },
    );

    if (!colRes.ok) return { error: colRes.status };

    const colData = await colRes.json();
    return { data: colData.data };
  } catch {
    return { error: 500 };
  }
}

export default async function SingleCollectionPage({ params }) {
  const { collectionId } = await params;

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  // ── All data fetching done outside JSX ─────────────────────────────────
  const { data: collection, error } = await getCollectionData(
    collectionId,
    cookieString,
  );

  // ── Error state — JSX safely outside try/catch ─────────────────────────
  if (error) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <p className="text-white text-xl">
          {error === 401
            ? "Please log in to view this."
            : "Collection not found."}
        </p>
      </section>
    );
  }

  const token = cookieStore.get("token")?.value;
  if (collection.visibility === "private") {
    const payload = await verifyToken(token);
    const userId =
      payload?._id?.toString() ||
      payload?.id?.toString() ||
      payload?.userId?.toString();

    if (!userId || userId !== collection.ownerId?.toString()) {
      redirect("/not-authorized");
    }
  }

  const moviesList =
    collection.moviesList?.length > 0
      ? (await Promise.all(collection.moviesList.map(getMovieDetails))).filter(
          Boolean,
        )
      : [];

  return (
    <section className="max-w-7xl flex-col mx-auto px-6 py-16 min-h-screen">
      <div className="mb-12 text-center space-y-4 relative">
        <h2 className="flex items-center justify-center gap-3 text-4xl font-bold text-white tracking-tight">
          <span className="text-brand">
            {collection.collectionName} —{" "}
            <span className="font-medium opacity-70">Collection</span>
          </span>
        </h2>
        {moviesList.length > 0 && (
          <p className="text-slate-400 mt-2 font-medium">
            Showing {moviesList.length} movies
          </p>
        )}

        {collection.visibility === "public" && (
          <div className="md:absolute md:top-2 md:right-4">
            <ShareButton
              title={collection.collectionName}
              text={`Check out my movie collection: ${collection.collectionName}`}
            />
          </div>
        )}

        {/* if user visibility is private check the useAuth userId and collection owner Id  and show content only if they match else redirect to not-authorized */}
      </div>

      {moviesList.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-6 mt-20">
          <Link href="/" title="Add movies">
            <svg
              className="text-7xl border rounded-full p-5 hover:text-brand active:text-shadow-brand"
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 14 14">
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 .54v13M.5 7h13"
              />
            </svg>
          </Link>
          <p className="text-xl font-light text-slate-400">
            No movies added in this collection yet.
          </p>
        </div>
      ) : (
        <SingleCollectionPageGrid
          moviesList={moviesList}
          collectionId={collectionId}
        />
      )}
    </section>
  );
}
