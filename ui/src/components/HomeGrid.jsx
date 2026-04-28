"use client";

import { useAuth } from "@/components/context/AuthContext";
import { useCollectionModal } from "@/components/context/CollectionModalContext";
import MovieCard from "./MovieCard";
import Pagination from "./Pagination";

export default function HomeGrid({ movieArr, currentPage, displayTotalPages }) {
  const { user } = useAuth();
  const { openModal } = useCollectionModal();

  // 1. Define the submit logic here, inside the component that knows about the 'user'
  const handleCollectionSubmit = async (data) => {
    if (!user?._id) {
      alert("Please log in to create a collection.");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: user._id,
          collectionName: data.collectionName,
          visibility: data.visibility,
        }),
      });

      if (!response.ok) throw new Error("Failed to save collection");

      console.log("Collection created successfully!");
      // Optionally trigger a refresh of your app state here
    } catch (err) {
      console.error("Error saving collection:", err);
    }
  };

  return (
    <main className="col-span-9 h-full overflow-y-auto p-8 custom-scrollbar">
      {/* Example: A button inside your grid to create a collection */}
      {/* <button
        onClick={() => openModal(null, handleCollectionSubmit)}
        className="mb-6 bg-brand px-4 py-2 rounded-lg text-white font-bold">
        + New Collection
      </button> */}

      {movieArr.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {movieArr.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="h-[60vh] flex flex-col items-center justify-center text-white/40">
          <p className="text-xl font-semibold tracking-tight">
            No movies found matching your current filters.
          </p>
        </div>
      )}

      {movieArr.length > 0 && (
        <div className="mt-12 mb-8">
          <Pagination
            currentPage={currentPage}
            totalPages={displayTotalPages}
          />
        </div>
      )}
    </main>
  );
}
