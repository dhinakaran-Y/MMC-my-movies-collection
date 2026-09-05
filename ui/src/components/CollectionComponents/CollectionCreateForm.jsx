"use client";

import { useState, useEffect } from "react";

export default function CollectionCreateForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setServerError("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    const trimmedName = data.collectionName?.trim();

    if (!trimmedName) {
      setServerError("Collection name cannot be empty.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (typeof onSubmit === "function") {
        const result = await onSubmit({ ...data, collectionName: trimmedName });
        if (result && result.error) {
          setServerError(result.error);
          return;
        }
      }
      onClose(); // Close the modal only after success
    } catch (err) {
      setServerError(err?.message || "Failed to create collection");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-dark-body2 p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-white/10 relative">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
          ✕
        </button>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold text-white mb-2">
            {initialData ? "Edit Collection" : "New Collection"}
          </h2>

          {serverError && (
            <div className="px-3.5 py-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-medium flex items-center gap-2">
              <span className="shrink-0">⚠️</span>
              <span>{serverError}</span>
            </div>
          )}

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
              disabled={isSubmitting}
              onChange={() => {
                if (serverError) setServerError("");
              }}
              autoCapitalize="words"
              autoFocus
              className={`w-full px-4 py-3 bg-dark-body1 border ${
                serverError
                  ? "border-red-500/80 ring-1 ring-red-500/80"
                  : "border-white/10 focus:ring-2 focus:ring-brand"
              } text-white rounded-xl outline-none disabled:opacity-60 transition-all`}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
            className="w-full bg-brand py-3 rounded-xl font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed">
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>
                  {initialData ? "Updating Collection..." : "Creating Collection..."}
                </span>
              </>
            ) : (
              <span>
                {initialData ? "Update Collection" : "Create Collection"}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
