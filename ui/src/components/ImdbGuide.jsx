"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ExternalLink,
  Search,
  Copy,
  Check,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Film,
  Sparkles,
  HelpCircle,
  Link as LinkIcon
} from "lucide-react";

const GUIDE_STEPS = [
  {
    step: 1,
    title: "Go to IMDb's Official Site",
    description: "Open your web browser and navigate to the official IMDb homepage.",
    url: "https://www.imdb.com",
    images: [
      {
        src: "/imdb_guide/step1-imdb-home.png",
        alt: "IMDb Official Homepage",
        caption: "Step 1: Visit https://www.imdb.com in your browser",
      },
    ],
  },
  {
    step: 2,
    title: "Search your movie & go to its detailed page",
    description: "Use IMDb's top search bar to type the movie or TV show title, then click the matching result to open its detailed page.",
    images: [
      {
        src: "/imdb_guide/step2a-search-movie.png",
        alt: "Search for a movie on IMDb",
        caption: "Step 2A: Type the movie title into the IMDb search bar",
      },
      {
        src: "/imdb_guide/step2b-movie-details.png",
        alt: "Open detailed movie page",
        caption: "Step 2B: Click the title to open its full details page",
      },
    ],
  },
  {
    step: 3,
    title: "Copy the IMDb ID from the URL bar",
    description: "Look at your browser's address bar. In the URL after '/title/', copy the unique ID starting with 'tt' (for example: tt1375666).",
    sampleId: "tt1375666",
    images: [
      {
        src: "/imdb_guide/step3-copy-imdb-id.png",
        alt: "Copy IMDb ID from URL",
        caption: "Step 3: Locate and copy the 'tt...' ID right after '/title/' in the address bar",
      },
    ],
  },
  {
    step: 4,
    title: "Paste the IMDb ID in our app's search",
    description: "Return to our app and paste the copied IMDb ID directly into the 'IMDb ID Search' input on the left sidebar to instantly fetch the movie details!",
    sampleId: "tt1375666",
    images: [],
  },
];

// Flatten all images for sequential lightbox navigation
const ALL_GUIDE_IMAGES = GUIDE_STEPS.flatMap((step) =>
  step.images.map((img) => ({
    ...img,
    stepNumber: step.step,
    stepTitle: step.title,
  }))
);

export default function ImdbGuide({ onClose }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeImageIndex, setActiveImageIndex] = useState(null);
  const [copiedSample, setCopiedSample] = useState(false);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("guide");
      router.push(`?${params.toString()}`, { scroll: false });
    }
  };

  const handleApplySampleId = (id) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("guide");
    params.delete("query");
    params.delete("page");
    params.set("imdbId", id);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleCopyText = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSample(true);
      setTimeout(() => setCopiedSample(false), 2000);
    }
  };

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback(
    (e) => {
      if (activeImageIndex === null) return;
      if (e.key === "Escape") {
        setActiveImageIndex(null);
      } else if (e.key === "ArrowRight") {
        setActiveImageIndex((prev) =>
          prev !== null ? (prev + 1) % ALL_GUIDE_IMAGES.length : null
        );
      } else if (e.key === "ArrowLeft") {
        setActiveImageIndex((prev) =>
          prev !== null
            ? (prev - 1 + ALL_GUIDE_IMAGES.length) % ALL_GUIDE_IMAGES.length
            : null
        );
      }
    },
    [activeImageIndex]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const openLightboxBySrc = (src) => {
    const idx = ALL_GUIDE_IMAGES.findIndex((img) => img.src === src);
    if (idx !== -1) setActiveImageIndex(idx);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/15 via-slate-900/90 to-slate-900/80 border border-amber-500/30 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step-by-Step Tutorial</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              How to Get a Movie&apos;s IMDb ID
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              An IMDb ID (e.g. <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">tt1375666</span>) lets you retrieve exact movie details, ratings, cast, and posters directly from the IMDb database. Follow these 4 easy steps below.
            </p>
          </div>

          <button
            onClick={handleClose}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Search</span>
          </button>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-8">
        {GUIDE_STEPS.map((item) => (
          <div
            key={item.step}
            className="rounded-2xl bg-slate-900/70 border border-white/10 hover:border-amber-500/30 transition-all p-6 sm:p-7 shadow-lg backdrop-blur-md relative group"
          >
            {/* Step header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                {item.step}
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex flex-wrap items-center gap-2">
                  {item.title}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition-all ml-1"
                    >
                      <span>Open IMDb</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </h2>
                <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                  {item.description}
                </p>

                {item.sampleId && item.step === 3 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400">URL Pattern:</span>
                    <span className="font-mono bg-black/60 text-slate-300 px-3 py-1.5 rounded-lg border border-white/10">
                      https://www.imdb.com/title/<span className="text-amber-400 font-bold bg-amber-500/20 px-1 rounded">{item.sampleId}</span>/
                    </span>
                    <button
                      onClick={() => handleCopyText(item.sampleId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all font-semibold cursor-pointer"
                    >
                      {copiedSample ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Sample ID</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {item.step === 4 && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        Want to test with an example?
                      </div>
                      <div className="text-xs text-slate-300">
                        Try searching Inception using ID: <span className="font-mono font-bold text-amber-300">tt1375666</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplySampleId("tt1375666")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md hover:shadow-amber-500/25 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Search &quot;tt1375666&quot; Now</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Step Images */}
            {item.images.length > 0 && (
              <div
                className={`mt-5 grid gap-4 ${
                  item.images.length > 1
                    ? "grid-cols-1 md:grid-cols-2"
                    : "grid-cols-1"
                }`}
              >
                {item.images.map((img, imgIdx) => (
                  <div
                    key={imgIdx}
                    onClick={() => openLightboxBySrc(img.src)}
                    className="group/img relative rounded-xl overflow-hidden border border-white/15 bg-black/40 shadow-md hover:border-amber-500/60 hover:shadow-amber-500/10 transition-all cursor-pointer"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950/60 flex items-center justify-center">
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        className="w-full h-full object-contain object-center group-hover/img:scale-[1.03] transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 text-slate-950 text-xs font-bold shadow-xl">
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>Click to Enlarge</span>
                        </span>
                      </div>
                    </div>
                    {/* Caption */}
                    <div className="p-3 bg-slate-900/90 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                      <span className="truncate pr-2 font-medium">{img.caption}</span>
                      <span className="text-[10px] text-amber-400/80 font-mono uppercase bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 flex-shrink-0">
                        Preview
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox / Fullscreen Image Preview Modal */}
      {activeImageIndex !== null && ALL_GUIDE_IMAGES[activeImageIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/90 backdrop-blur-xl animate-fadeIn"
          onClick={() => setActiveImageIndex(null)}
        >
          {/* Modal Container */}
          <div
            className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-950/90 border border-white/20 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/95 border-b border-white/10 text-white z-10">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                  {ALL_GUIDE_IMAGES[activeImageIndex].stepNumber}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {ALL_GUIDE_IMAGES[activeImageIndex].stepTitle}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {ALL_GUIDE_IMAGES[activeImageIndex].caption}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-white/50 font-mono">
                  {activeImageIndex + 1} / {ALL_GUIDE_IMAGES.length}
                </span>
                <button
                  onClick={() => setActiveImageIndex(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Image View */}
            <div className="relative flex-1 min-h-[50vh] max-h-[75vh] w-full flex items-center justify-center bg-black/95 p-2 sm:p-4 overflow-hidden">
              <div className="relative w-full h-[65vh] max-h-[70vh]">
                <Image
                  src={ALL_GUIDE_IMAGES[activeImageIndex].src}
                  alt={ALL_GUIDE_IMAGES[activeImageIndex].alt}
                  fill
                  className="object-contain rounded-lg shadow-2xl transition-all"
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  priority
                />
              </div>

              {/* Prev / Next Buttons */}
              {ALL_GUIDE_IMAGES.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) =>
                        (prev - 1 + ALL_GUIDE_IMAGES.length) % ALL_GUIDE_IMAGES.length
                      );
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/20 flex items-center justify-center transition-all shadow-xl cursor-pointer"
                    title="Previous Image (Left Arrow)"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) =>
                        (prev + 1) % ALL_GUIDE_IMAGES.length
                      );
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/20 flex items-center justify-center transition-all shadow-xl cursor-pointer"
                    title="Next Image (Right Arrow)"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-2.5 bg-slate-900/95 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span className="hidden sm:inline">Use Arrow keys (← / →) to navigate, Esc to close</span>
              <div className="flex items-center gap-2 ml-auto">
                {ALL_GUIDE_IMAGES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                      idx === activeImageIndex
                        ? "bg-amber-400 w-6"
                        : "bg-white/30 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
