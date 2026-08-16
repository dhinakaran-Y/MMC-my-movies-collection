"use client";

import { useState } from "react";

export default function CollectionCreateForm({
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
      if (typeof onSubmit === "function") {
        await onSubmit(data); // Calls the function passed from the grid
      }
      onClose(); // Close the modal after success
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-dark-body2 p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-white/10 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white">
          ✕
        </button>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold text-white mb-4">
            {initialData ? "Edit Collection" : "New Collection"}
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">
              Collection Name
            </label>
            <input
              name="collectionName"
              type="text"
              placeholder="ex: Crime & Investigation"
              defaultValue={initialData?.collectionName || ""}
              required
              autoCapitalize="words"
              autoFocus
              className="w-full px-4 py-3 bg-dark-body1 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-brand outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">
              Visibility
            </label>
            <div className="flex bg-dark-body1 p-1 rounded-xl border border-white/5">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  className="hidden peer"
                  defaultChecked={
                    initialData ? initialData.visibility === "public" : true
                  }
                />
                <div className="text-center py-2 rounded-lg text-sm font-semibold text-white/40 peer-checked:bg-brand/70 peer-checked:text-white transition-all">
                  Public
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  className="hidden peer"
                  defaultChecked={initialData?.visibility === "private"}
                />
                <div className="text-center py-2 rounded-lg text-sm font-semibold text-white/40 peer-checked:bg-brand/70 peer-checked:text-white transition-all">
                  Private
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand py-3 rounded-xl font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50">
            {isSubmitting
              ? "Saving..."
              : initialData
                ? "Update Collection"
                : "Create Collection"}
          </button>
        </form>
      </div>
    </div>
  );
}
