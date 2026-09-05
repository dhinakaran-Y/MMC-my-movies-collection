"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/context/AuthContext";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    googleUsers: 0,
    localUsers: 0,
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
          googleUsers: usersData.googleCount || 0,
          localUsers: usersData.localCount || 0,
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
      label: "Local (MMC) Accounts",
      value: stats.localUsers,
      icon: "🛡️",
      color: "text-rose-500",
    },
    {
      label: "Google Accounts",
      value: stats.googleUsers,
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      ),
      color: "text-amber-400",
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
      {statCards.map((stat, i) => (
        <div
          key={i}
          className="bg-dark-body2 border border-white/5 p-6 rounded-2xl shadow-xl transition-all hover:border-white/10 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-2xl flex items-center justify-center">{stat.icon}</span>
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
