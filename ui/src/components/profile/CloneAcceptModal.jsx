"use client";

import { useEffect, useState } from "react";

export default function CloneAcceptModal({ isOpen, onClose, request, onConfirm }) {
  const [sharingMode, setSharingMode] = useState("all");
  const [collections, setCollections] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch giver's own collections when modal opens (for custom mode)
  useEffect(() => {
    if (!isOpen) return;
    setSharingMode("all");
    setSelectedIds([]);
    setIsLoading(true);

    async function fetchMyCollections() {
      try {
        const meRes = await fetch(`/api/me`, { credentials: "include" });
        const meData = await meRes.json();
        const colRes = await fetch(`/api/get-collections/${meData.user._id}`, {
          credentials: "include",
        });
        const colData = await colRes.json();
        setCollections(colData.collections || []);
      } catch (err) {
        console.error("Failed to fetch collections:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMyCollections();
  }, [isOpen, request]);

  const toggleCollection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    setSelectedIds(collections.map((c) => c._id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const handleConfirm = async () => {
    if (sharingMode === "custom" && selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      await onConfirm({
        action: "accept",
        sharingMode,
        selectedCollections: sharingMode === "custom" ? selectedIds : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const sharingOptions = [
    { value: "all", label: "All Collections", icon: "📦", desc: "Clone every collection you own" },
    { value: "public", label: "Public Only", icon: "🌐", desc: "Only public visibility collections" },
    { value: "private", label: "Private Only", icon: "🔒", desc: "Only private visibility collections" },
    { value: "custom", label: "Custom Select", icon: "✏️", desc: "Manually pick which collections to share" },
  ];

  const publicCount = collections.filter((c) => c.visibility === "public").length;
  const privateCount = collections.filter((c) => c.visibility === "private").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-dark-body2 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5">
          <h3 className="text-lg font-bold text-white">Accept Clone Request</h3>
          <p className="text-white/40 text-sm mt-1">
            Choose which collections to share with{" "}
            <span className="text-white/70 font-medium">
              {request?.requesterId?.name || "the requester"}
            </span>
          </p>
        </div>

        {/* Sharing Mode Selection */}
        <div className="px-6 py-4 space-y-2">
          <p className="text-xs text-white/30 uppercase tracking-wider font-semibold mb-3">
            Sharing Mode
          </p>
          <div className="grid grid-cols-2 gap-2">
            {sharingOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSharingMode(opt.value)}
                className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  sharingMode === opt.value
                    ? "border-brand bg-brand/10 shadow-lg shadow-brand/5"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{opt.icon}</span>
                  <span className={`text-sm font-medium ${sharingMode === opt.value ? "text-brand" : "text-white/80"}`}>
                    {opt.label}
                  </span>
                </div>
                <span className="text-[11px] text-white/30 leading-tight">{opt.desc}</span>
                {/* count badge */}
                {opt.value === "all" && (
                  <span className="text-[10px] text-white/40 mt-0.5">{collections.length} collections</span>
                )}
                {opt.value === "public" && (
                  <span className="text-[10px] text-white/40 mt-0.5">{publicCount} collections</span>
                )}
                {opt.value === "private" && (
                  <span className="text-[10px] text-white/40 mt-0.5">{privateCount} collections</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Collection Picker */}
        {sharingMode === "custom" && (
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-white/30 uppercase tracking-wider font-semibold">
                Select Collections
              </p>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-[11px] text-brand hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-white/20">|</span>
                <button
                  onClick={deselectAll}
                  className="text-[11px] text-white/40 hover:underline cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="py-6 text-center text-white/30 text-sm">Loading collections...</div>
            ) : collections.length === 0 ? (
              <div className="py-6 text-center text-white/30 text-sm">No collections found.</div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-xl border border-white/5 p-2 bg-dark-body3">
                {collections.map((col) => {
                  const isSelected = selectedIds.includes(col._id);
                  return (
                    <label
                      key={col._id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "bg-brand/10 border border-brand/30"
                          : "bg-white/3 border border-transparent hover:bg-white/5"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCollection(col._id)}
                        className="accent-brand w-4 h-4 rounded cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white truncate block">{col.collectionName}</span>
                        <span className="text-[10px] text-white/30">
                          {col.moviesList?.length || 0} movies · {col.visibility}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          col.visibility === "public"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-white/10 text-white/40"
                        }`}
                      >
                        {col.visibility}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {selectedIds.length > 0 && (
              <p className="text-xs text-brand mt-2">
                {selectedIds.length} collection{selectedIds.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white/50 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || (sharingMode === "custom" && selectedIds.length === 0)}
            className="px-5 py-2 text-sm font-semibold bg-brand text-white rounded-lg hover:bg-brand/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isSubmitting ? "Sharing..." : "Share Collections"}
          </button>
        </div>
      </div>
    </div>
  );
}
