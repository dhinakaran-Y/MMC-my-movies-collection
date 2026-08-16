"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/context/AuthContext";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWatched: 0,
    totalCollections: 0,
  });

  useEffect(() => {
    // Only fetch if user is logged in and is an admin
    if (user?.role !== "admin") return;

    const fetchStats = async () => {
      try {
        setDataLoading(true);
        // Assuming your backend has these endpoints
        const [usersRes, watchedRes, colRes] = await Promise.all([
          fetch(`/api/admin/users-count`, { credentials: "include" }),
          fetch(`/api/admin/watched-movies-count`, {
            credentials: "include",
          }),
          fetch(`/api/admin/collections-count`, { credentials: "include" }),
        ]);

        const usersData = await usersRes.json();
        const watchedData = await watchedRes.json();
        const colData = await colRes.json();

        setStats({
          totalUsers: usersData.count || 0,
          totalWatched: watchedData.count || 0,
          totalCollections: colData.count || 0,
        });
      } catch (err) {
        console.error("Error fetching admin stats:", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (authLoading || dataLoading) {
    return (
      <div className="flex mt-[10vh] items-center justify-center text-white">
        Loading Dashboard...
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center text-white">
        Access Denied. Admins only.
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: "👤",
      color: "text-blue-500",
    },
    {
      label: "Movies in Watchlists",
      value: stats.totalWatched,
      icon: "🎬",
      color: "text-brand",
    },
    {
      label: "Active Collections",
      value: stats.totalCollections,
      icon: "📁",
      color: "text-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 gap-x-20 mb-10">
      {statCards.map((stat, i) => (
        <div
          key={i}
          className="bg-dark-body2 border border-white/5 p-6 rounded-2xl shadow-xl transition-all hover:border-white/10">
          <div className="flex justify-between items-start">
            <span className="text-2xl">{stat.icon}</span>
          </div>
          <p className="text-white/40 text-xs uppercase font-bold mt-4 tracking-widest">
            {stat.label}
          </p>
          <h3 className={`text-3xl font-mono font-bold mt-1 ${stat.color}`}>
            {stat.value.toLocaleString()}
          </h3>
        </div>
      ))}
    </div>
  );
}
