"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserTableRow({
  user,
  index,
  onRefresh,
  userCollections,
  userWatchedMovies,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    password: "",
  });
  const router = useRouter();

  const handleUpdate = async (e) => {
    e.preventDefault();
    await fetch(`/api/admin/users/${user._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });
    setIsEditing(false);
    onRefresh();
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
    await fetch(`/api/admin/users/${user._id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    onRefresh();
  };

  if (isEditing) {
    return (
      <tr className="bg-dark-body2 border-b border-brand/20">
        <td colSpan="8" className="px-6 py-4">
          <form onSubmit={handleUpdate} className="flex gap-4 items-center">
            <input
              className="bg-white/5 p-2 rounded text-xs text-white"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Name"
              autoFocus
            />
            <input
              className="bg-white/5 p-2 rounded text-xs text-white"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Email"
            />
            <select
              className="bg-white/5 p-2 rounded text-xs text-white"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <input
              className="bg-white/5 p-2 rounded text-xs text-white"
              type="password"
              placeholder="New Password"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
            <button
              type="submit"
              className="bg-brand px-4 py-2 rounded text-white text-xs hover:bg-brand/80">
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-white/50 text-xs hover:text-white">
              Cancel
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-white/5 transition-colors border-b border-white/5">
      <td className="px-6 py-4 text-white/50 text-center">{index + 1}</td>
      <td className="px-6 py-4 font-medium">{user.name}</td>
      <td className="px-6 py-4 text-white/50">{user.email}</td>
      <td className="px-6 py-4 text-center">
        {user.authProvider === "google" ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 text-white border border-white/15">
            <svg className="w-3 h-3" viewBox="0 0 24 24">
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
            Google
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Local (MMC)
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <span
          className={`px-2 py-1 rounded-md text-[10px] ${user.role === "admin" ? "bg-brand/20 text-brand" : "bg-white/10 text-white/60"}`}>
          {user.role}
        </span>
      </td>

      <td className="px-6 py-4 text-center">
        <select
          onChange={(e) => router.push(`/collections/${e.target.value}`)}
          className="bg-dark-body4 text-center min-w-20 text-blue-400 border border-blue-500/30 rounded-lg p-2 text-xs font-semibold cursor-pointer focus:outline-none">
          <option value="">{userCollections.length} Collections</option>
          {userCollections.map((col) => (
            <option key={col._id} value={col._id}>
              {col.collectionName}
            </option>
          ))}
        </select>
      </td>

      <td className="px-6 py-4 text-white/50 text-center">
        {userWatchedMovies.length}
      </td>

      <td className="px-6 py-4 text-right">
        <button
          onClick={() => setIsEditing(true)}
          className="text-white/30 hover:text-white mr-3 text-xs">
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="text-red-500/50 hover:text-red-500 text-xs">
          Delete
        </button>
      </td>
    </tr>
  );
}
