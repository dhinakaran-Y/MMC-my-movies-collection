"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CollectionMovieCard from "@/components/CollectionComponents/CollectionMovieCard";
import CustomMovieCreateForm from "@/components/CollectionComponents/CustomMovieCreateForm";
import OttFilterBar from "@/components/CollectionComponents/OttFilterBar";

export default function SingleCollectionPageGrid({ moviesList = [], collectionId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleCustomMovieSubmit = async (formData) => {
    const res = await fetch("/api/custom-movie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...formData,
        collectionId,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create custom movie.");
    }

    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* OTT Filter Bar for Region and Watch Option */}
      <OttFilterBar />

      {/* Grid with Create Custom Movie card as first item */}
      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {/* Create Custom Movie Card */}
        <div
          onClick={() => setIsModalOpen(true)}
          className="group cursor-pointer w-full h-90 sm:h-100 md:h-110 lg:h-120 border-2 border-dashed border-slate-700 hover:border-brand/60 rounded-xl flex flex-col items-center justify-center transition-all duration-300 hover:bg-brand/5 bg-dark-body2/30 shadow-lg">
          <div className="p-4 rounded-full bg-slate-800/90 group-hover:bg-brand/10 group-hover:scale-110 transition-all duration-300 border border-white/5">
            <svg
              className="text-slate-400 group-hover:text-brand transition-colors"
              xmlns="http://www.w3.org/2000/svg"
              width="2.5em"
              height="2.5em"
              viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M14 14q1 0 1-1v-2h2q1 0 1-1t-1-1h-2V7q0-1-1-1t-1 1v2h-2q-1 0-1 1t1 1h2v2q0 1 1 1Zm-6 4q-.825 0-1.413-.588T6 16V4q0-.825.588-1.413T8 2h12q.825 0 1.413.588T22 4v12q0 .825-.588 1.413T20 18H8Zm0-2h12V4H8v12Zm-4 6q-.825 0-1.413-.588T2 20V7q0-.425.288-.713T3 6q.425 0 .713.288T4 7v13h13q.425 0 .713.288T18 21q0 .425-.288.713T17 22H4ZM8 4v12V4Z"
              />
            </svg>
          </div>
          <span className="mt-4 text-slate-500 group-hover:text-brand font-semibold uppercase tracking-wider text-xs">
            Create Custom Movie
          </span>
        </div>

        {/* Collection Movies List */}
        {moviesList.map((movie) => (
          <CollectionMovieCard
            key={movie.storedId || movie.id}
            movie={movie}
            collectionId={collectionId}
          />
        ))}
      </main>

      {/* Modal */}
      <CustomMovieCreateForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCustomMovieSubmit}
        collectionId={collectionId}
      />
    </div>
  );
}