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
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${user._id}`, {
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
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${user._id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    onRefresh();
  };

  if (isEditing) {
    return (
      <tr className="bg-dark-body2 border-b border-brand/20">
        <td colSpan="7" className="px-6 py-4">
          <form onSubmit={handleUpdate} className="flex gap-4 items-center">
            <input
              className="bg-white/5 p-2 rounded text-xs text-white"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Name"
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
