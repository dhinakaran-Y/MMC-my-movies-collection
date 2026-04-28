"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/context/AuthContext";
import UserEditForm from "@/components/profile/UserEditForm";
import { useRouter } from "next/navigation";

export default function ProfileDiv() {
  const { user, loading, logout, setUser } = useAuth();
  const router = useRouter();

  // State for stats
  const [collectionCount, setCollectionCount] = useState(0);
  const [watchedCount, setWatchedCount] = useState(0);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // State for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch Stats
  useEffect(() => {
    async function fetchUserStats() {
      if (!user?._id) return;
      try {
        const [colRes, watchRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/get-collections/${user._id}`,{credentials:"include"}),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/watch-list/${user._id}`,{credentials:"include"}),
        ]);

        const colData = await colRes.json();
        const watchData = await watchRes.json();

        setCollectionCount(colData.collections?.length || 0);
        setWatchedCount(watchData.movies?.length || 0);
      } catch (err) {
        console.error("Failed to fetch profile stats:", err);
      } finally {
        setIsDataLoading(false);
      }
    }
    fetchUserStats();
  }, [user?._id]);

  // Handle Edit Logic
  const handleProfileUpdate = async (data) => {
    console.log("formdata : ", data);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      console.log(res);

      if (res.ok) {
        alert("Profile updated! Please refresh the page.");
        setUser((prev) => ({
          ...prev,
          ...data,
        }));
      } else {
        throw new Error(res.status, res.json);
      }
    } catch (err) {
      alert("Failed to update profile.", err);
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] w-screen flex justify-center items-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-15 space-y-4">
        {/* Profile img */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Image
              className="rounded-full p-1 shadow-lg shadow-brand/10"
              src="/profile-img.png"
              alt="Profile Avatar"
              width={140}
              height={140}
              priority
            />
            {/* Edit Trigger - You can put this here or near the name */}
            <div
              onClick={() => setIsModalOpen(true)}
              className="absolute bottom-1 right-1 w-8 h-8 bg-brand rounded-full flex items-center justify-center border-2 border-dark-body2 cursor-pointer hover:scale-110 transition-transform">
              <span className="text-white text-xs">✎</span>
            </div>
          </div>
        </div>

        {/* info */}
        <div className="space-y-2 flex flex-col items-center">
          <h1 className="text-3xl font-bold text-white">
            {user?.name ? user.name : "Guest"}
          </h1>
          <p className="text-white/60 gap-2">
            <span>✉</span> {user?.email}
          </p>

          <button
            className="flex items-center space-x-1 mt-4 cursor-pointer active:scale-90 px-6 py-1.5 border border-brand group text-brand text-sm font-semibold rounded-full hover:bg-brand hover:text-white transition-all duration-300"
            onClick={() => logout()}>
            <span>
              <svg
                height="24"
                viewBox="0 0 24 24"
                width="24"
                focusable="false"
                className="fill-brand group-hover:fill-white">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"></path>
              </svg>
            </span>
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="w-xs lg:w-sm mx-auto grid grid-cols-2 gap-4">
        {/* Collections */}
        <div className="bg-dark-body2 border border-brand rounded-xl p-6 shadow-md">
          <div className="flex flex-col items-center">
            <span className="text-white/40 text-xs font-bold uppercase tracking-wider">
              📁 Collections
            </span>
            <span className="text-4xl font-mono font-bold text-white mt-1">
              {isDataLoading ? "..." : collectionCount}
            </span>
          </div>
        </div>

        {/* Watched */}
        <div className="bg-dark-body2 border border-blue-500 rounded-xl p-6 shadow-md">
          <div className="flex flex-col items-center">
            <span className="text-white/40 text-xs font-bold uppercase tracking-wider">
              🎬 Watched
            </span>
            <span className="text-4xl font-mono font-bold text-white mt-1">
              {isDataLoading ? "..." : watchedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Modal Form */}
      <UserEditForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleProfileUpdate}
        initialData={user}
      />
    </>
  );
}
