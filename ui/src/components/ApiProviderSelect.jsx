"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";

export const API_PROVIDERS = [
  {
    id: "tmdb",
    name: "TMDB",
    fullName: "The Movie Database",
    badge: "Default",
    logo: "/providers/tmdb.svg",
    logoType: "svg",
    website: "https://www.themoviedb.org/",
  },
  {
    id: "tvmaze",
    name: "TVmaze",
    fullName: "TVmaze Series & Shows",
    badge: "Free API",
    logo: "/providers/tvmaze.png",
    logoType: "png",
    website: "https://www.tvmaze.com/",
  },
  {
    id: "watchmode",
    name: "Watchmode",
    fullName: "Streaming Availability",
    badge: "Where to Watch",
    logo: "/providers/watchmode.png",
    logoType: "png",
    website: "https://www.watchmode.com/",
  },
  {
    id: "anilist",
    name: "AniList",
    fullName: "Anime & Manga Database",
    badge: "Anime",
    logo: "/providers/anilist.svg",
    logoType: "svg",
    website: "https://anilist.co/home",
  },
  {
    id: "omdb",
    name: "OMDb",
    fullName: "Open Movie Database",
    badge: "Ratings",
    logo: "/providers/omdb.svg",
    logoType: "svg",
    website: "https://www.omdbapi.com/",
  },
];

export default function ApiProviderSelect({ activeProvider = "tmdb", onSelectProvider }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedProvider =
    API_PROVIDERS.find((p) => p.id === activeProvider) || API_PROVIDERS[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col space-y-2 ml-2" ref={dropdownRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
          API Provider
        </label>
        <span className="text-[10px] text-brand font-semibold px-2 py-0.5 bg-brand/10 border border-brand/20 rounded-full">
          {selectedProvider.badge}
        </span>
      </div>

      <div className="relative">
        {/* Dropdown Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-800 text-white rounded-xl border transition-all duration-200 shadow-md ${
            isOpen ? "border-brand ring-1 ring-brand shadow-brand/10" : "border-white/10 hover:border-white/20"
          }`}>
          {/* Left: Name & Full Title */}
          <div className="flex flex-col text-left">
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              {selectedProvider.name}
              {selectedProvider.id === "tmdb" && (
                <span className="text-[10px] text-white/40 font-normal">(Default)</span>
              )}
            </span>
            <span className="text-[11px] text-white/50 truncate max-w-[140px]">
              {selectedProvider.fullName}
            </span>
          </div>

          {/* Right: Logo & Chevron */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-dark-body1/80 border border-white/10 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              <Image
                src={selectedProvider.logo}
                alt={selectedProvider.name}
                width={28}
                height={28}
                className="object-contain max-h-6 max-w-6"
                unoptimized
              />
            </div>
            <svg
              className={`w-4 h-4 text-white/60 transition-transform duration-200 ${
                isOpen ? "rotate-180 text-brand" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Dropdown Options Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-white/5 animate-in fade-in slide-in-from-top-2 duration-150">
            {API_PROVIDERS.map((provider) => {
              const isSelected = provider.id === selectedProvider.id;
              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => {
                    onSelectProvider?.(provider.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-all text-left group ${
                    isSelected
                      ? "bg-brand/15 text-white"
                      : "hover:bg-white/5 text-white/80 hover:text-white"
                  }`}>
                  {/* Left: Provider Name & Info */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold transition-colors ${
                          isSelected ? "text-brand" : "group-hover:text-white"
                        }`}>
                        {provider.name}
                      </span>
                      {provider.id === "tmdb" && (
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-brand/20 text-brand font-bold">
                          Default
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-white/50 group-hover:text-white/70">
                      {provider.fullName}
                    </span>
                  </div>

                  {/* Right: Official Logo */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg bg-dark-body1 border p-1 flex items-center justify-center overflow-hidden shrink-0 transition-all ${
                        isSelected
                          ? "border-brand shadow-[0_0_8px_rgba(229,9,20,0.4)]"
                          : "border-white/10 group-hover:border-white/30"
                      }`}>
                      <Image
                        src={provider.logo}
                        alt={provider.name}
                        width={28}
                        height={28}
                        className="object-contain max-h-6 max-w-6"
                        unoptimized
                      />
                    </div>
                    {isSelected && (
                      <span className="text-brand font-bold text-sm">✓</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
