"use client";

import { useSearchParams, useRouter } from "next/navigation";
import FilteredLanguagesArr from "@/data/FilteredLanguagesArr.json";
import dynamic from "next/dynamic";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/context/AuthContext";

const Select = dynamic(() => import("react-select"), { ssr: false });

export default function AsideFilter({ genresArr = [], currentLang, Genre, currentType = "movie" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isGenresOpen, setIsGenresOpen] = useState(true); // Toggle State
  const [hoveredWatchDesc, setHoveredWatchDesc] = useState(null);

  // Search state for controlled input
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("query") || "",
  );
  const searchTimeoutRef = useRef(null);

  // Sync search input when searchParams change
  useEffect(() => {
    setSearchQuery(searchParams.get("query") || "");
  }, [searchParams]);

  // Save active filter state to sessionStorage whenever filters change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const qs = window.location.search;
      if (qs) {
        sessionStorage.setItem("mmc_home_filters", qs);
      }
    }
  }, [searchParams]);

  // Restore saved filter state when navigating back to Home without query params
  useEffect(() => {
    if (typeof window !== "undefined" && !window.location.search) {
      const saved = sessionStorage.getItem("mmc_home_filters");
      if (saved) {
        router.replace(saved);
      }
    }
  }, [router]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const languageOptions = [
    { value: "all", label: "All Languages" },
    ...FilteredLanguagesArr.map((l) => ({
      value: l.language,
      label: l.languageName,
    })),
  ];

  const activeLang = searchParams.has("lang")
    ? (currentLang || "all")
    : (user?.language || "all");

  const defaultValue =
    languageOptions.find((opt) => opt.value === activeLang) || languageOptions[0];

  // --- OTT Region ---
  const regionOptions = [
    { value: "IN", label: "India" },
    { value: "US", label: "United States" },
    { value: "GB", label: "United Kingdom" },
    { value: "CA", label: "Canada" },
    { value: "AU", label: "Australia" },
    { value: "DE", label: "Germany" },
    { value: "FR", label: "France" },
    { value: "JP", label: "Japan" },
    { value: "KR", label: "South Korea" },
    { value: "BR", label: "Brazil" },
    { value: "IT", label: "Italy" },
    { value: "ES", label: "Spain" },
    { value: "MX", label: "Mexico" },
    { value: "SE", label: "Sweden" },
    { value: "NL", label: "Netherlands" },
    { value: "SG", label: "Singapore" },
    { value: "AE", label: "UAE" },
    { value: "ZA", label: "South Africa" },
    { value: "PH", label: "Philippines" },
    { value: "TH", label: "Thailand" },
  ];

  const activeRegion = searchParams.has("region")
    ? (searchParams.get("region") || "IN")
    : (user?.region || "IN");

  const defaultRegion =
    regionOptions.find((opt) => opt.value === activeRegion) || regionOptions[0];

  // --- Watch Option (Monetization Type) ---
  const watchOptionOptions = [
    { value: "flatrate", label: "Streaming", desc: "Subscription streaming (Netflix, Prime, etc.)" },
    { value: "buy", label: "Purchase", desc: "Digital purchase to own permanently" },
    { value: "rent", label: "Rental", desc: "Digital rental for a limited period" },
    { value: "free", label: "Free", desc: "Free streaming without subscription" },
    { value: "ads", label: "Ads-Supported", desc: "Free streaming with advertisements" },
  ];

  const activeWatchOption = searchParams.has("watchOption")
    ? (searchParams.get("watchOption") || "flatrate")
    : (user?.watchOption || "flatrate");

  const defaultWatchOption =
    watchOptionOptions.find((opt) => opt.value === activeWatchOption) || watchOptionOptions[0];

  const updateRoute = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());

    if (key === "type") {
      // When switching media type, clear genre (genres differ between movie/tv)
      // and reset page, but keep language and topRated
      params.delete("genre");
      params.delete("query");
      params.delete("page");
      if (value && value !== "movie") params.set("type", value);
      else params.delete("type"); // "movie" is default, no need in URL
    } else if (key === "query") {
      params.delete("lang");
      params.delete("topRated");
      params.delete("genre");

      if (value) params.set("query", value);
      else params.delete("query");
    } else if (key === "genre") {
      params.delete("query");
      const currentGenres = params.get("genre")
        ? params
            .get("genre")
            .split(",")
            .filter((id) => id !== "")
        : [];

      if (currentGenres.includes(value)) {
        const filtered = currentGenres.filter((id) => id !== value);
        if (filtered.length > 0) params.set("genre", filtered.join(","));
        else params.delete("genre");
      } else {
        const newGenres = [...currentGenres, value];
        params.set("genre", newGenres.join(","));
      }
    } else {
      params.delete("query");
      if (value) params.set(key, value);
      else params.delete(key);
    }

    params.delete("page");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Debounced search handler
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      updateRoute("query", val);
    }, 1000); // 500ms debounce
  };

  const selectedGenres = searchParams.get("genre")?.split(",") || [];
  const isTV = currentType === "tv";

  return (
    <aside className="col-span-full lg:col-span-3 bg-dark-body2 p-5 pt-10 flex flex-col space-y-8 lg:h-full lg:overflow-y-auto custom-scrollbar border-r border-white/5">
      <div className="flex justify-between px-3 items-baseline">
        <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">
          Filters
        </span>
        <button
          onClick={() => {
            const userRegion = user?.region || "IN";
            const resetQs = isTV
              ? `?type=tv&lang=all&region=${userRegion}&watchOption=flatrate`
              : `?lang=all&region=${userRegion}&watchOption=flatrate`;
            setSearchQuery("");
            if (typeof window !== "undefined") {
              sessionStorage.setItem("mmc_home_filters", resetQs);
            }
            router.push(`/${resetQs}`);
          }}
          className="text-xs font-light text-brand hover:underline">
          Reset All
        </button>
      </div>

      {/* 0. Media Type Toggle — Movie / TV */}
      <div className="space-y-2 ml-2">
        <label className="text-xs font-bold text-white/50 uppercase">
          Media Type
        </label>
        <div className="flex rounded-xl overflow-hidden border border-white/10">
          <button
            onClick={() => updateRoute("type", "movie")}
            className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              !isTV
                ? "bg-brand text-white shadow-lg shadow-brand/30"
                : "bg-dark-body1 text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}>
            <span>🎬</span>
            <span>Movies</span>
          </button>
          <button
            onClick={() => updateRoute("type", "tv")}
            className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              isTV
                ? "bg-brand text-white shadow-lg shadow-brand/30"
                : "bg-dark-body1 text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}>
            <span>📺</span>
            <span>TV Shows</span>
          </button>
        </div>
      </div>

      {/* 1. Search Bar with Icon */}
      <div className="space-y-2 relative">
        <div className="relative flex items-center">
          <svg
            className="absolute left-4 w-4 h-4 text-white/40 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-11 pr-4 py-2.5 rounded-full border border-white/20 bg-dark-body1 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-white/30 text-sm"
            placeholder={isTV ? "Search TV show title..." : "Search movie title..."}
          />
        </div>
      </div>

      {/* 2. Language dropdown */}
      <div className="flex flex-col space-y-2 ml-2">
        <label className="text-xs font-bold text-white/50 uppercase">
          Language
        </label>
        <Select
          id="languageSelect"
          options={languageOptions}
          value={defaultValue}
          placeholder="Search and select language"
          isSearchable
          menuPortalTarget={typeof document !== "undefined" ? document.body : null}
          menuPosition="fixed"
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          }}
          unstyled
          classNames={{
            control: ({ isFocused }) =>
              `bg-slate-800 text-white p-1 rounded-xl border transition-all ${
                isFocused ? "border-brand ring-1 ring-brand" : "border-white/10"
              } cursor-pointer text-sm`,
            menu: () =>
              "bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden mt-1",
            menuList: () =>
              "max-h-56 overflow-y-auto custom-scrollbar p-1",
            option: ({ isFocused, isSelected }) =>
              `px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                isSelected
                  ? "bg-brand text-white font-medium"
                  : isFocused
                    ? "bg-white/10 text-white"
                    : "text-white/70"
              }`,
            placeholder: () => "text-white/30 px-2",
            singleValue: () => "text-white px-2",
            input: () => "text-white px-2",
            dropdownIndicator: () => "text-white/40 hover:text-white px-2",
          }}
          onChange={(selectedOption) =>
            updateRoute("lang", selectedOption.value)
          }
        />
      </div>

      {/* 3. OTT Region dropdown */}
      <div className="flex flex-col space-y-2 ml-2">
        <label className="text-xs font-bold text-white/50 uppercase">
          OTT Region
        </label>
        <Select
          id="regionSelect"
          options={regionOptions}
          value={defaultRegion}
          placeholder="Select OTT region"
          isSearchable
          menuPortalTarget={typeof document !== "undefined" ? document.body : null}
          menuPosition="fixed"
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          }}
          unstyled
          classNames={{
            control: ({ isFocused }) =>
              `bg-slate-800 text-white p-1 rounded-xl border transition-all ${
                isFocused ? "border-brand ring-1 ring-brand" : "border-white/10"
              } cursor-pointer text-sm`,
            menu: () =>
              "bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden mt-1",
            menuList: () =>
              "max-h-56 overflow-y-auto custom-scrollbar p-1",
            option: ({ isFocused, isSelected }) =>
              `px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                isSelected
                  ? "bg-brand text-white font-medium"
                  : isFocused
                    ? "bg-white/10 text-white"
                    : "text-white/70"
              }`,
            placeholder: () => "text-white/30 px-2",
            singleValue: () => "text-white px-2",
            input: () => "text-white px-2",
            dropdownIndicator: () => "text-white/40 hover:text-white px-2",
          }}
          onChange={(selectedOption) =>
            updateRoute("region", selectedOption.value)
          }
        />
      </div>

      {/* 4. Watch Option (Monetization Type) */}
      <div className="flex flex-col space-y-2 ml-2">
        <label className="text-xs font-bold text-white/50 uppercase">
          Watch Option
        </label>
        <div className="flex flex-wrap gap-2 pt-1">
          {watchOptionOptions.map((opt) => {
            const isActive = activeWatchOption === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onMouseEnter={() => setHoveredWatchDesc(opt.desc)}
                onMouseLeave={() => setHoveredWatchDesc(null)}
                onClick={() => updateRoute("watchOption", opt.value)}
                className={`px-3 py-1.5 text-[11px] rounded-full border cursor-pointer transition-all duration-200 select-none font-medium ${
                  isActive
                    ? "bg-brand border-brand text-white shadow-lg shadow-brand/30"
                    : "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:bg-white/10"
                }`}>
                {opt.label}
              </button>
            );
          })}
        </div>
        {/* Sleek toast description box that never clips */}
        <div className="pt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-white/70 bg-slate-800/80 border border-white/10 px-3 py-1.5 rounded-xl shadow-inner transition-all duration-200">
            <span className="text-brand text-xs">ℹ</span>
            <span className="leading-tight">
              {hoveredWatchDesc || defaultWatchOption.desc}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Genres - Toggleable */}
      <div className="flex flex-col space-y-3 ml-2">
        <div
          className="flex justify-between items-center cursor-pointer group"
          onClick={() => setIsGenresOpen(!isGenresOpen)}>
          <label className="text-xs font-bold text-white/50 uppercase cursor-pointer">
            Genres
          </label>
          <span className="text-white/40 group-hover:text-white transition-colors">
            {isGenresOpen ? "−" : "+"}
          </span>
        </div>

        {isGenresOpen && (
          <div className="flex flex-wrap gap-2 max-h-75 overflow-y-auto custom-scrollbar pr-2 animate-in slide-in-from-top-2 duration-300">
            {genresArr.map((genre) => {
              const isActive = selectedGenres.includes(String(genre.id));
              return (
                <label
                  key={genre.id}
                  className={`px-3 py-1.5 text-[11px] rounded-full border cursor-pointer transition-all duration-200 select-none font-medium ${
                    isActive
                      ? "bg-brand border-brand text-white shadow-lg shadow-brand/30"
                      : "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:bg-white/10"
                  }`}>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isActive}
                    onChange={() => updateRoute("genre", String(genre.id))}
                  />
                  {genre.name}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Top Rated */}
      <div className="flex items-center justify-between px-2 py-4 border-t border-white/5">
        <label
          htmlFor="rating-checkbox"
          className="select-none text-sm font-medium text-white/80 flex items-center gap-3 cursor-pointer">
          <span className="text-lg">⭐</span>
          <span>Top Rated Only</span>
        </label>
        <input
          id="rating-checkbox"
          type="checkbox"
          checked={searchParams.get("topRated") === "true"}
          className="w-5 h-5 rounded border-white/20 bg-dark-body1 accent-brand cursor-pointer"
          onChange={(e) =>
            updateRoute("topRated", e.target.checked ? "true" : "")
          }
        />
      </div>
    </aside>
  );
}
