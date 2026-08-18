"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function CustomMovieCreateForm({
  isOpen,
  onClose,
  onSubmit,
  collectionId = null,
  isWatchList = false,
  initialData = null,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState(false);
  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  const [mediaType, setMediaType] = useState("movie");
  const [formError, setFormError] = useState("");

  // Pre-fill fields when editing
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || initialData.name || "");
      setImageUrl(initialData.poster_path || "");
      setOverview(initialData.overview || "");
      setMediaType(initialData.mediaType || "movie");
    } else {
      setTitle("");
      setImageUrl("");
      setOverview("");
      setMediaType("movie");
    }
    setImageError(false);
    setFormError("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleImageUrlChange = (e) => {
    setImageUrl(e.target.value);
    setImageError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Movie title is required.");
      return;
    }
    if (!imageUrl.trim()) {
      setFormError("Image URL is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (typeof onSubmit === "function") {
        await onSubmit({
          id: initialData?._id || initialData?.id,
          title: title.trim(),
          poster_path: imageUrl.trim(),
          overview: overview.trim(),
          mediaType,
          collectionId,
          addToWatchList: isWatchList,
        });
      }
      onClose();
    } catch (err) {
      console.error("Custom movie submission error:", err);
      setFormError(err.message || "Failed to save movie. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-dark-body2 p-6 rounded-3xl w-full max-w-lg shadow-2xl border border-white/10 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors text-lg">
          ✕
        </button>

        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <span className="text-brand">✨</span>
          <span>
            {initialData ? "Edit Custom Item" : `Create Custom ${mediaType === "tv" ? "TV Show" : "Movie"}`}
          </span>
        </h2>
        <p className="text-xs text-white/50 mb-6">
          {initialData
            ? "Update your custom movie details below."
            : `Add your own custom title to your ${isWatchList ? "watched list" : "collection"}.`}
        </p>

        {formError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-xs text-red-300">
            {formError}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Media Type Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
              Type
            </label>
            <div className="flex bg-dark-body1 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setMediaType("movie")}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mediaType === "movie"
                    ? "bg-brand text-white shadow-md"
                    : "text-white/50 hover:text-white"
                }`}>
                🎬 Movie
              </button>
              <button
                type="button"
                onClick={() => setMediaType("tv")}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mediaType === "tv"
                    ? "bg-brand text-white shadow-md"
                    : "text-white/50 hover:text-white"
                }`}>
                📺 TV Series
              </button>
            </div>
          </div>

          {/* Title Field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1">
              Title <span className="text-brand font-bold">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Inception, Attack on Titan..."
              required
              className="w-full px-4 py-2.5 bg-dark-body1 border border-white/10 text-white rounded-xl focus:ring-1 focus:ring-brand focus:border-brand outline-none text-sm transition-all placeholder:text-white/30"
            />
          </div>

          {/* Image URL Field with Preview */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1">
              Image URL <span className="text-brand font-bold">*</span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={handleImageUrlChange}
              placeholder="https://example.com/poster.jpg"
              required
              className="w-full px-4 py-2.5 bg-dark-body1 border border-white/10 text-white rounded-xl focus:ring-1 focus:ring-brand focus:border-brand outline-none text-sm transition-all placeholder:text-white/30"
            />

            {/* Poster Preview */}
            {imageUrl && (
              <div className="mt-3 flex items-center gap-4 p-3 bg-dark-body1/60 rounded-xl border border-white/5">
                <div className="relative w-16 h-24 rounded-lg overflow-hidden border border-white/10 bg-dark-body1 flex-shrink-0">
                  <Image
                    src={imageError ? "/fallbackImg.png" : imageUrl}
                    alt="Poster Preview"
                    className="object-cover w-full h-full"
                    width={100}
                    height={150}
                    unoptimized
                    onError={() => setImageError(true)}
                  />
                </div>
                <div className="text-xs text-white/60 flex-1">
                  <p className="font-semibold text-white/80 mb-0.5">Poster Preview</p>
                  {imageError ? (
                    <span className="text-red-400">Failed to load image link. Will use fallback.</span>
                  ) : (
                    <span className="text-emerald-400">Image loaded successfully ✓</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Description Field - OPTIONAL */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-white/60 uppercase tracking-wider">
                Description
              </label>
              <span className="text-[11px] text-white/40 italic">Optional</span>
            </div>
            <textarea
              rows={3}
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="Write a brief overview or synopsis of the movie (optional)..."
              className="w-full px-4 py-2.5 bg-dark-body1 border border-white/10 text-white rounded-xl focus:ring-1 focus:ring-brand focus:border-brand outline-none text-sm transition-all placeholder:text-white/30 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-semibold text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-brand py-3 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-brand/20">
              {isSubmitting
                ? "Saving..."
                : initialData
                  ? "Save Changes"
                  : "Add to List"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
