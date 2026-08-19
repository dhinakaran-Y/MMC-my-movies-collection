import Link from "next/link";
import SingleCollectionPageGrid from "./SingleCollectionPageGrid";
import ShareButton from "@/components/CollectionComponents/ShareBtn";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

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

export async function generateMetadata({ params }) {
  const { collectionId } = await params;

  try {
    const res = await fetch(getApiUrl(`/collection/${collectionId}`), {
      cache: "no-store",
    });

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
    const colRes = await fetch(getApiUrl(`/collection/${collectionId}`), {
      method: "GET",
      cache: "no-store",
      headers: { Cookie: cookieString },
    });

    if (!colRes.ok) return { error: colRes.status };

    const colData = await colRes.json();
    return { data: colData.data };
  } catch (err) {
    console.error("getCollectionData error:", err);
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
      ? (await Promise.all(collection.moviesList.map(getMediaDetails))).filter(
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
            Showing {moviesList.length} items
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

        {/* if user visibility is private check the useAuth userId and collection owner Id and show content only if they match else redirect to not-authorized */}
      </div>

      <SingleCollectionPageGrid
        moviesList={moviesList}
        collectionId={collectionId}
      />
    </section>
  );
}
