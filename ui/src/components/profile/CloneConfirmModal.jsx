"use client";

import { useEffect, useState } from "react";

export default function CloneConfirmModal({ isOpen, onClose, request, onConfirm }) {
  const [collections, setCollections] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterMode, setFilterMode] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch shared collections when modal opens
  useEffect(() => {
    if (!isOpen || !request) return;
    setFilterMode("all");
    setSelectedIds([]);
    setExpandedId(null);
    setIsLoading(true);

    async function fetchShared() {
      try {
        const res = await fetch(`/api/clone-request/${request._id}/shared-collections`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          const cols = data.data || [];
          setCollections(cols);
          setSelectedIds(cols.map((c) => c._id));
        }
      } catch (err) {
        console.error("Failed to fetch shared collections:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchShared();
  }, [isOpen, request]);

function formatMovieId(rawId) {
  if (!rawId) return "Unknown item";
  if (typeof rawId !== "string") return String(rawId);
  if (rawId.startsWith("custom:")) return `Custom Media (${rawId.slice(7, 15)}...)`;
  if (rawId.startsWith("tvmaze:")) {
    const parts = rawId.split(":");
    return `TVmaze Show #${parts[2] || parts[1]}`;
  }
  if (rawId.startsWith("omdb:") || rawId.startsWith("tt")) return `IMDb/OMDb: ${rawId.replace("omdb:", "")}`;
  if (rawId.startsWith("anilist:")) return `AniList Anime #${rawId.replace("anilist:", "")}`;
  if (rawId.startsWith("watchmode:")) return `WatchMode Title #${rawId.replace("watchmode:", "")}`;
  if (!isNaN(rawId)) return `TMDB Movie #${rawId}`;
  return rawId;
}

  const toggleCollection = (id) => {
    setFilterMode("custom");
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleTabClick = (mode) => {
    setFilterMode(mode);
    if (mode === "all") {
      setSelectedIds(collections.map((c) => c._id));
    } else if (mode === "public") {
      setSelectedIds(collections.filter((c) => c.visibility === "public").map((c) => c._id));
    } else if (mode === "private") {
      setSelectedIds(collections.filter((c) => c.visibility === "private").map((c) => c._id));
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Filter collections
  const filteredCollections = collections.filter((col) => {
    if (filterMode === "all" || filterMode === "custom") return true;
    if (filterMode === "public") return col.visibility === "public";
    if (filterMode === "private") return col.visibility === "private";
    return true;
  });

  const handleSelectFiltered = () => {
    setSelectedIds(filteredCollections.map((c) => c._id));
  };

  const handleDeselectAll = () => {
    setFilterMode("custom");
    setSelectedIds([]);
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      await onConfirm({ selectedCollections: selectedIds });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const publicCount = collections.filter((c) => c.visibility === "public").length;
  const privateCount = collections.filter((c) => c.visibility === "private").length;

  const filterTabs = [
    { value: "all", label: `All (${collections.length})` },
    { value: "public", label: `Public (${publicCount})` },
    { value: "private", label: `Private (${privateCount})` },
    { value: "custom", label: `Custom (${selectedIds.length})` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-dark-body2 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5 shrink-0">
          <h3 className="text-lg font-bold text-white">Review & Clone Collections</h3>
          <p className="text-white/40 text-sm mt-1">
            <span className="text-white/70 font-medium">
              {request?.giverId?.name || "The giver"}
            </span>{" "}
            shared {collections.length} collection{collections.length !== 1 ? "s" : ""}. Select which ones to clone.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 pt-3 pb-2 flex items-center gap-2 border-b border-white/5 shrink-0 flex-wrap">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabClick(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterMode === tab.value
                  ? "bg-brand/15 text-brand border border-brand/30"
                  : "bg-white/5 text-white/50 border border-transparent hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={handleSelectFiltered} className="text-[11px] text-brand hover:underline cursor-pointer">
            Select All
          </button>
          <span className="text-white/15">|</span>
          <button onClick={handleDeselectAll} className="text-[11px] text-white/40 hover:underline cursor-pointer">
            Deselect
          </button>
        </div>

        {/* Collection List */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {isLoading ? (
            <div className="py-10 text-center text-white/30 text-sm">Loading shared collections...</div>
          ) : filteredCollections.length === 0 ? (
            <div className="py-10 text-center text-white/30 text-sm">No collections match this filter.</div>
          ) : (
            <div className="space-y-2">
              {filteredCollections.map((col) => {
                const isSelected = selectedIds.includes(col._id);
                const isExpanded = expandedId === col._id;
                return (
                  <div
                    key={col._id}
                    className={`rounded-xl border transition-all ${
                      isSelected
                        ? "border-brand/30 bg-brand/5"
                        : "border-white/5 bg-white/3"
                    }`}
                  >
                    {/* Collection Row */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCollection(col._id)}
                        className="accent-brand w-4 h-4 rounded cursor-pointer shrink-0"
                      />
                      <button
                        onClick={() => toggleExpand(col._id)}
                        className="flex-1 min-w-0 text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white font-medium truncate group-hover:text-brand transition-colors">
                            {col.collectionName}
                          </span>
                          <svg
                            className={`w-3.5 h-3.5 text-white/30 transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-white/30">
                            {col.moviesList?.length || 0} movies
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              col.visibility === "public"
                                ? "bg-green-500/10 text-green-400"
                                : "bg-white/10 text-white/40"
                            }`}
                          >
                            {col.visibility}
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Expanded Movies Preview */}
                    {isExpanded && (
                      <div className="px-4 pb-3 border-t border-white/5 mt-0">
                        {col.moviesList && col.moviesList.length > 0 ? (
                          <div className="pt-2 space-y-1 max-h-40 overflow-y-auto">
                            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">
                              Movies in this collection
                            </p>
                            {col.moviesList.map((movieId, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/3 text-xs text-white/60"
                              >
                                <span className="text-white/20">{idx + 1}.</span>
                                <span className="truncate font-mono text-[11px]">{formatMovieId(movieId)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="py-3 text-xs text-white/25 text-center">This collection is empty.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between shrink-0">
          <span className="text-xs text-white/40">
            {selectedIds.length} of {collections.length} selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-white/50 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting || selectedIds.length === 0}
              className="px-5 py-2 text-sm font-semibold bg-brand text-white rounded-lg hover:bg-brand/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isSubmitting
                ? "Cloning..."
                : `Clone ${selectedIds.length} Collection${selectedIds.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
