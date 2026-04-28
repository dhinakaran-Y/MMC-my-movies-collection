"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/context/AuthContext";
import { useCollectionModal } from "@/components/context/CollectionModalContext";
import CollectionCard from "@/components/CollectionComponents/CollectionCard";
import CollectionCreateForm from "@/components/CollectionComponents/CollectionCreateForm";

// Skeleton component for layout consistency while loading
const SkeletonCard = () => (
  <div className="h-72 w-full bg-slate-800 animate-pulse rounded-3xl border border-white/5"></div>
);

export default function CollectionGrid() {
  const [isOpen, setIsOpen] = useState(false);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingData, setEditingData] = useState(null);
  const [watchedMoviesCount, setWatchedMoviesCount] = useState(0);

  const { user } = useAuth();
  const router = useRouter();

  // 1. Fetch Collections
  const fetchCollections = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/get-collections/${user._id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch WatchList Count
  const fetchWatchList = async () => {
    if (!user?._id) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/watch-list/${user._id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.movies) {
        setWatchedMoviesCount(data.movies.length);
      }
    } catch (error) {
      console.error("Failed to fetch watchlist:", error);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchCollections();
      fetchWatchList();
    }
  }, [user]);

  // 3. Create / Update Handler
  const handleCollectionSubmit = async (data) => {
    const endpoint = editingData
      ? `${process.env.NEXT_PUBLIC_API_URL}/collection/${editingData._id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/collection`;
    const method = editingData ? "PATCH" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ownerId: user._id,
        collectionName: data.collectionName,
        visibility: data.visibility,
      }),
    });

    if (res.ok) {
      setIsOpen(false);
      setEditingData(null);
      fetchCollections();
    }
  };

  // 4. Delete Handler
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this collection?")) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collection/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    fetchCollections();
  };

  const handleEditClick = (col) => {
    setEditingData(col);
    setIsOpen(true);
  };

  return (
    <>
      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Create New Collection Button */}
        <div
          onClick={() => {
            setEditingData(null);
            setIsOpen(true);
          }}
          className={`group cursor-pointer h-72 border-2 border-dashed border-slate-700 hover:border-brand/50 rounded-3xl flex flex-col items-center justify-center transition-all duration-300 hover:bg-brand/5 ${loading ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="p-4 rounded-full bg-slate-800 group-hover:bg-brand/10 transition-colors">
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
            Create New
          </span>
        </div>

        {/* Watched Movies Card */}
        <Link href={`collections/watch-list/${user ? user._id : ""}`}>
          <div className="group relative cursor-pointer h-72 rounded-3xl bg-[#25283a] border border-white/5 flex flex-col items-center justify-center transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/40">
            <h1 className="text-slate-400 group-hover:text-white capitalize font-semibold text-center text-xl">
              Watched
            </h1>
            <div className="mt-4 px-3 py-1 rounded-full bg-black/20 text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-white/5 group-hover:border-brand/30 group-hover:text-brand/80 transition-all">
              {loading ? "..." : `${watchedMoviesCount} movies`}
            </div>
          </div>
        </Link>

        {/* Collection Cards (or Skeletons) */}
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          collections.map((col) => (
            <CollectionCard
              key={col._id}
              collection={col}
              onDelete={() => handleDelete(col._id)}
              onEdit={() => handleEditClick(col)}
            />
          ))
        )}
      </main>

      {/* Modal */}
      <CollectionCreateForm
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setEditingData(null);
        }}
        onSubmit={handleCollectionSubmit}
        initialData={editingData}
      />
    </>
  );
}
