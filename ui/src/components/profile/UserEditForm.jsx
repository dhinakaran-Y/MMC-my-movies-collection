"use client";

import { useState } from "react";

export default function UserEditForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      await onSubmit(data); // Calls the function from ProfileDiv
      onClose();
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-dark-body2 p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-white/10 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white">
          ✕
        </button>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold text-white mb-4">Edit Profile</h2>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">
              Name
            </label>
            <input
              name="name"
              type="text"
              defaultValue={initialData?.name}
              required
              autoFocus
              className="w-full px-4 py-3 bg-dark-body1 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">
              Email
            </label>
            <input
              name="email"
              type="email"
              defaultValue={initialData?.email}
              required
              className="w-full px-4 py-3 bg-dark-body1 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">
              New Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="Leave blank to keep current"
              className="w-full px-4 py-3 bg-dark-body1 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand py-3 rounded-xl font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
