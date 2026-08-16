"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/context/AuthContext";
import UserTableRow from "@/components/adminComponents/UserTableRow";

export function UserDashboard() {
  const { user, loading } = useAuth();
  const [userList, setUserList] = useState([]);
  const [collections, setCollections] = useState([]);
  const [watchLists, setWatchLists] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Unified fetcher for everything
  const fetchAllData = async () => {
    try {
      setIsDataLoading(true);
      const [userRes, colRes, watchRes] = await Promise.all([
        fetch(`/api/users`, { credentials: "include" }),
        fetch(`/api/all-collections`, { credentials: "include" }),
        fetch(`/api/all-watchList`, { credentials: "include" }),
      ]);

      if (!userRes.ok) throw new Error("Auth failed");

      const userData = await userRes.json();
      const colData = await colRes.json();
      const watchData = await watchRes.json();

      setUserList(Array.isArray(userData) ? userData : []);
      setCollections(colData.data || []);
      setWatchLists(watchData.data || []);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchAllData();
  }, [user]);

  // Group data by ownerId for O(1) performance lookup
  const dataMap = useMemo(() => {
    return {
      collectionsByOwner: collections.reduce((acc, col) => {
        if (!acc[col.ownerId]) acc[col.ownerId] = [];
        acc[col.ownerId].push(col);
        return acc;
      }, {}),
      watchListsByOwner: watchLists.reduce((acc, list) => {
        acc[list.ownerId] = list.watchedMoviesList || [];
        return acc;
      }, {}),
    };
  }, [collections, watchLists]);

  if (loading || isDataLoading)
    return (
      <div className="p-10 text-white text-center">Loading Dashboard...</div>
    );

  if (!user || user.role !== "admin")
    return <div className="p-10 text-white text-center">Access Denied</div>;

  return (
    <div className="w-full max-w-7xl mx-auto bg-dark-body2 rounded-2xl border border-white/5 overflow-hidden shadow-2xl mt-10">
      <div className="p-6 border-b border-white/5 flex justify-between items-center">
        <h2 className="font-bold text-white text-lg">User Management</h2>
        <button
          onClick={fetchAllData}
          className="text-xs text-brand hover:underline">
          Refresh Data
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-white/30 text-[10px] uppercase tracking-tighter border-b border-white/5">
              <th className="px-6 py-4 text-center">S.no</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 text-center">Collections</th>
              <th className="px-6 py-4 text-center">Watched Movies</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {userList.map((u, index) => (
              <UserTableRow
                key={u._id}
                user={u}
                index={index}
                userCollections={dataMap.collectionsByOwner[u._id] || []}
                userWatchedMovies={dataMap.watchListsByOwner[u._id] || []}
                onRefresh={fetchAllData}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
