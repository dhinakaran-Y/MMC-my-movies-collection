"use client";

import { useSearchParams, useRouter } from "next/navigation";
import FilteredLanguagesArr from "@/data/FilteredLanguagesArr.json";
import LanguageRegionMappedData from "@/data/LanguageRegionMappedData.json";
import dynamic from "next/dynamic";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/context/AuthContext";
import ApiProviderSelect from "@/components/ApiProviderSelect";
import RangeSlider from "@/components/RangeSlider";
import StreamingServicePills from "@/components/StreamingServicePills";
import {
  getGenres as tvmazeGenres,
  getLanguages as tvmazeLanguages,
  getShowStatuses,
  getShowTypes,
  getCountries as tvmazeCountries,
} from "@/lib/providers/tvmazeAdapter";
import {
  getContentTypes as watchmodeContentTypes,
  getServiceTypes as watchmodeServiceTypes,
  getSortOptions as watchmodeSortOptions,
  getRegions as watchmodeRegions,
} from "@/lib/providers/watchmodeAdapter";
import {
  getAnimeCategories as anilistAnimeCategories,
  getMangaCategories as anilistMangaCategories,
  getAnimeFormats as anilistAnimeFormats,
  getMangaFormats as anilistMangaFormats,
  getAiringStatuses as anilistAiringStatuses,
  getPublishingStatuses as anilistPublishingStatuses,
  getSeasons as anilistSeasons,
  getSources as anilistSources,
  getCountries as anilistCountries,
  getSortOptions as anilistSortOptions,
  getStreamingServices as anilistStreamingServices,
} from "@/lib/providers/anilistAdapter";

const Select = dynamic(() => import("react-select"), { ssr: false });

export default function AsideFilter({
  genresArr = [],
  tagsArr = [],
  currentLang,
  Genre,
  currentType = "movie",
  provider = "tmdb",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isGenresOpen, setIsGenresOpen] = useState(true);
  const [isAdvancedTagsOpen, setIsAdvancedTagsOpen] = useState(false);
  const [hoveredWatchDesc, setHoveredWatchDesc] = useState(null);

  const activeProvider = searchParams.get("provider") || "tmdb";
  const isTvmaze = activeProvider === "tvmaze";
  const isWatchmode = activeProvider === "watchmode";
  const isAnilist = activeProvider === "anilist";
  const isOmdb = activeProvider === "omdb";

  // Focus refs to prevent searchParams sync from overwriting active typing
  const isSearchFocusedRef = useRef(false);
  const isYearFocusedRef = useRef(false);
  const isImdbFocusedRef = useRef(false);

  // Search state for controlled inputs
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("query") || "",
  );
  const [yearQuery, setYearQuery] = useState(
    searchParams.get("year") || "",
  );
  const [imdbIdQuery, setImdbIdQuery] = useState(
    searchParams.get("imdbId") || "",
  );
  const searchTimeoutRef = useRef(null);

  // Sync search inputs when searchParams change (only if user is not actively typing)
  useEffect(() => {
    if (!isSearchFocusedRef.current) {
      setSearchQuery(searchParams.get("query") || "");
    }
    if (!isYearFocusedRef.current) {
      setYearQuery(searchParams.get("year") || "");
    }
    if (!isImdbFocusedRef.current) {
      setImdbIdQuery(searchParams.get("imdbId") || "");
    }
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

  // ── TMDB Language Options ──
  const languageOptions = [
    { value: "all", label: "All Languages" },
    ...FilteredLanguagesArr.map((l) => ({
      value: l.language,
      label: l.languageName,
    })),
  ];

  // ── TVmaze Language Options ──
  const tvmazeLanguageOptions = [
    { value: "all", label: "All Languages" },
    ...tvmazeLanguages().map((lang) => ({
      value: lang,
      label: lang,
    })),
  ];

  const activeLang = searchParams.has("lang")
    ? (searchParams.get("lang") === "all" ? "" : searchParams.get("lang"))
    : "";

  const currentLanguageOptions = isTvmaze
    ? tvmazeLanguageOptions
    : languageOptions;

  const defaultValue =
    currentLanguageOptions.find((opt) => opt.value === activeLang) ||
    currentLanguageOptions[0];

  // ── TMDB & Watchmode OTT Region Options ──
  const userRegion = user?.region || "IN";

  const SUPPORTED_WM_REGIONS = ["US", "IN", "CA"];
  const rawRegion = searchParams.has("region")
    ? (searchParams.get("region") || "")
    : (user?.region || "");

  const activeRegion = isWatchmode
    ? (rawRegion && SUPPORTED_WM_REGIONS.includes(rawRegion.toUpperCase()) ? rawRegion.toUpperCase() : "US")
    : (rawRegion || "IN");

  const regionOptions = Array.from(
    new Map(
      LanguageRegionMappedData.map((item) => [
        item.region,
        { value: item.region, label: item.regionName },
      ])
    ).values()
  ).sort((a, b) => a.label.localeCompare(b.label));

  const defaultRegion =
    regionOptions.find((r) => r.value === userRegion) || regionOptions[0];

  // ── Watchmode OTT Region Options ──
  const wmRegionOptions = watchmodeRegions().map((r) => ({
    value: r.code,
    label: `${r.flag} ${r.country}`,
  }));

  // ── Watch Option (Monetization Types) ──
  const activeWatchOption = searchParams.has("watchOption")
    ? (searchParams.get("watchOption") || "flatrate")
    : (user?.watchOption || "flatrate");

  const watchOptionOptions = [
    {
      value: "flatrate",
      label: "Streaming",
      desc: "Included with subscription (Netflix, Prime, Hotstar, etc.)",
    },
    {
      value: "rent",
      label: "Rent",
      desc: "Pay a one-time fee to watch for a 48-hour window",
    },
    {
      value: "buy",
      label: "Buy",
      desc: "Purchase to own digitally in your library permanently",
    },
    {
      value: "free",
      label: "Free",
      desc: "Watch for free with ads (YouTube, MX Player, JioCinema, etc.)",
    },
  ];

  const defaultWatchOption =
    watchOptionOptions.find((o) => o.value === activeWatchOption) ||
    watchOptionOptions[0];

  // ── TVmaze-specific filter values ──
  const activeShowStatus = searchParams.get("showStatus") || "";
  const activeShowType = searchParams.get("showType") || "";
  const activeCountry = searchParams.get("country") || "";
  const activeTvmazeSortBy = searchParams.get("sortBy") || "popularity";

  const showStatusOptions = getShowStatuses();
  const showTypeOptions = getShowTypes();
  const countryOptions = tvmazeCountries().map((c) => ({
    value: c.code,
    label: c.name,
  }));
  const tvmazeSortByOptions = [
    { value: "popularity", label: "🔥 Popularity" },
    { value: "rating", label: "⭐ Rating" },
    { value: "name", label: "🔤 Name A-Z" },
    { value: "newest", label: "🆕 Newest First" },
  ];

  // ── Watchmode-specific filter values ──
  const activeWmType = searchParams.get("wmType") || "";
  const activeServiceTypes = searchParams.get("serviceTypes")?.split(",").filter(Boolean) || [];
  const activeSourceIds = searchParams.get("sourceIds")?.split(",").filter(Boolean) || [];
  const activeWmSortBy = searchParams.get("sortBy") || "popularity_desc";

  const wmContentTypes = watchmodeContentTypes();
  const wmServiceTypes = watchmodeServiceTypes();
  const wmSortOptions = watchmodeSortOptions();

  // ── AniList-specific filter values ──
  const activeAnilistType = (searchParams.get("type") || "ANIME").toUpperCase() === "MANGA" ? "MANGA" : "ANIME";
  const activeCategory = searchParams.get("category") || (searchParams.get("query") || searchParams.get("genre") || searchParams.get("tag") ? "" : "trending");
  const activeSeason = searchParams.get("season") || "";
  const activeFormat = searchParams.get("format") || "";
  const activeStatus = searchParams.get("status") || "";
  const activeSource = searchParams.get("source") || "";
  const activeAnilistCountry = searchParams.get("country") || "";
  const activeSortBy = searchParams.get("sortBy") || "POPULARITY_DESC";
  const activeTags = searchParams.get("tag")?.split(",").filter(Boolean) || [];
  const activeStreamingOn = searchParams.get("streamingOn")?.split(",").filter(Boolean) || [];

  const anilistCategoryOptions = activeAnilistType === "MANGA" ? anilistMangaCategories() : anilistAnimeCategories();
  const anilistFormatOptions = activeAnilistType === "MANGA" ? anilistMangaFormats() : anilistAnimeFormats();
  const anilistStatusOptions = activeAnilistType === "MANGA" ? anilistPublishingStatuses() : anilistAiringStatuses();
  const anilistSeasonOptions = anilistSeasons();
  const anilistSourceOptions = anilistSources();
  const anilistCountryOptions = anilistCountries();
  const anilistSortByOptions = anilistSortOptions();
  const anilistStreamingOptions = anilistStreamingServices();

  const updateRoute = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());

    if (key === "provider") {
      const newParams = new URLSearchParams();
      if (value && value !== "tmdb") newParams.set("provider", value);
      router.push(`?${newParams.toString()}`, { scroll: false });
      return;
    } else if (key === "type") {
      if (isOmdb) {
        // OMDb type toggle: preserve query, year, imdbId — only change type
        params.delete("page");
        if (value) params.set("type", value);
        else params.delete("type");
      } else {
        params.delete("genre");
        params.delete("query");
        params.delete("page");
        if (value && value !== "movie") params.set("type", value);
        else params.delete("type");
      }
    } else if (key === "query") {
      params.delete("lang");
      params.delete("topRated");
      params.delete("genre");
      params.delete("showStatus");
      params.delete("showType");
      params.delete("country");
      params.delete("sortBy");
      params.delete("wmType");
      params.delete("serviceTypes");
      params.delete("sourceIds");
      params.delete("yearStart");
      params.delete("yearEnd");
      params.delete("ratingLow");
      params.delete("ratingHigh");
      params.delete("criticLow");
      params.delete("criticHigh");
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
    } else if (key === "tag") {
      params.delete("query");
      const currentTags = params.get("tag")
        ? params.get("tag").split(",").filter(Boolean)
        : [];
      if (currentTags.includes(value)) {
        const filtered = currentTags.filter((t) => t !== value);
        if (filtered.length > 0) params.set("tag", filtered.join(","));
        else params.delete("tag");
      } else {
        params.set("tag", [...currentTags, value].join(","));
      }
    } else if (key === "streamingOn") {
      params.delete("query");
      const currentServices = params.get("streamingOn")
        ? params.get("streamingOn").split(",").filter(Boolean)
        : [];
      if (currentServices.includes(value)) {
        const filtered = currentServices.filter((s) => s !== value);
        if (filtered.length > 0) params.set("streamingOn", filtered.join(","));
        else params.delete("streamingOn");
      } else {
        params.set("streamingOn", [...currentServices, value].join(","));
      }
    } else if (key === "serviceTypes") {
      params.delete("query");
      if (value) params.set("serviceTypes", value);
      else params.delete("serviceTypes");
    } else if (key === "sourceIds") {
      params.delete("query");
      const current = params.get("sourceIds")
        ? params
            .get("sourceIds")
            .split(",")
            .filter(Boolean)
        : [];

      if (current.includes(value)) {
        const filtered = current.filter((id) => id !== value);
        if (filtered.length > 0) params.set("sourceIds", filtered.join(","));
        else params.delete("sourceIds");
      } else {
        const updated = [...current, value];
        params.set("sourceIds", updated.join(","));
      }
    } else {
      params.delete("query");
      if (value) params.set(key, value);
      else params.delete(key);
    }

    params.delete("page");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const updateRange = (lowKey, lowVal, highKey, highVal, defaultLow, defaultHigh) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("query");
    params.delete("page");

    if (lowVal !== undefined && Number(lowVal) !== defaultLow) {
      params.set(lowKey, String(lowVal));
    } else {
      params.delete(lowKey);
    }

    if (highVal !== undefined && Number(highVal) !== defaultHigh) {
      params.set(highKey, String(highVal));
    } else {
      params.delete(highKey);
    }

    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Debounced search handlers
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      updateRoute("query", val.trim());
    }, 400);
  };

  const handleTitleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setImdbIdQuery("");

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("imdbId");
      params.delete("page");
      if (val.trim()) params.set("query", val.trim());
      else params.delete("query");
      router.push(`?${params.toString()}`, { scroll: false });
    }, 400);
  };

  const handleYearSearchChange = (e) => {
    const val = e.target.value;
    setYearQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      if (val.trim()) params.set("year", val.trim());
      else params.delete("year");
      router.push(`?${params.toString()}`, { scroll: false });
    }, 400);
  };

  const handleImdbIdSearchChange = (e) => {
    const val = e.target.value;
    setImdbIdQuery(val);
    setSearchQuery("");

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("query");
      params.delete("page");
      if (val.trim()) params.set("imdbId", val.trim());
      else params.delete("imdbId");
      router.push(`?${params.toString()}`, { scroll: false });
    }, 400);
  };

  const selectedGenres = searchParams.get("genre")?.split(",").filter(Boolean) || [];
  const isTV = currentType === "tv" || isTvmaze;

  // ── Shared classNames for react-select ──
  const selectClassNames = {
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
  };

  // ── Pill button helper ──
  const PillGroup = ({
    options,
    activeValue,
    paramKey,
    labelKey = "label",
    valueKey = "value",
  }) => (
    <div className="flex flex-wrap gap-2 pt-1">
      {options.map((opt) => {
        const optValue = typeof opt === "string" ? opt : opt[valueKey];
        const optLabel = typeof opt === "string" ? opt : opt[labelKey];
        const isActive = activeValue === optValue;
        return (
          <button
            key={optValue}
            type="button"
            onClick={() => updateRoute(paramKey, isActive ? "" : optValue)}
            className={`px-3 py-1.5 text-[11px] rounded-full border cursor-pointer transition-all duration-200 select-none font-medium ${
              isActive
                ? "bg-brand border-brand text-white shadow-lg shadow-brand/30"
                : "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:bg-white/10"
            }`}>
            {optLabel}
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className="col-span-full lg:col-span-3 bg-dark-body2 p-5 pt-8 flex flex-col space-y-6 lg:h-full lg:overflow-y-auto custom-scrollbar border-r border-white/5">
      {/* Dynamic API Provider Dropdown */}
      <ApiProviderSelect
        activeProvider={activeProvider}
        onSelectProvider={(prov) => updateRoute("provider", prov)}
      />

      <div className="border-t border-white/10 pt-2" />

      <div className="flex justify-between px-3 items-baseline">
        <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">
          Filters
        </span>
        <button
          onClick={() => {
            const userRegion = user?.region || "IN";
            let resetQs;
            if (isOmdb) {
              resetQs = `?provider=omdb`;
              setSearchQuery("");
              setYearQuery("");
              setImdbIdQuery("");
            } else if (isAnilist) {
              const currentAnilistType = (searchParams.get("type") || "ANIME").toUpperCase() === "MANGA" ? "MANGA" : "ANIME";
              resetQs = `?provider=anilist&type=${currentAnilistType}`;
              setIsAdvancedTagsOpen(false);
            } else if (isWatchmode) {
              resetQs = `?provider=watchmode&region=US`;
            } else if (isTvmaze) {
              resetQs = `?provider=tvmaze`;
            } else {
              resetQs = isTV
                ? `?type=tv&lang=all&region=${userRegion}&watchOption=flatrate`
                : `?lang=all&region=${userRegion}&watchOption=flatrate`;
            }
            setSearchQuery("");
            setYearQuery("");
            setImdbIdQuery("");
            if (typeof window !== "undefined") {
              sessionStorage.setItem("mmc_home_filters", resetQs);
            }
            router.push(`/${resetQs}`);
          }}
          className="text-xs font-light text-brand hover:underline">
          Reset All
        </button>
      </div>

      {/* 0. Media Type Toggle — Movie / TV (TMDB only) */}
      {!isTvmaze && !isWatchmode && !isAnilist && !isOmdb && (
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
      )}

      {/* 0. Media Type Toggle — Anime / Manga (AniList only) */}
      {isAnilist && (
        <div className="space-y-2 ml-2">
          <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
            Media Type
          </label>
          <div className="flex rounded-xl overflow-hidden border border-white/10 bg-dark-body1 p-0.5">
            <button
              onClick={() => updateRoute("type", "ANIME")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 rounded-lg flex items-center justify-center ${
                activeAnilistType === "ANIME"
                  ? "bg-brand text-white shadow-md shadow-brand/20"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}>
              Anime
            </button>
            <button
              onClick={() => updateRoute("type", "MANGA")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 rounded-lg flex items-center justify-center ${
                activeAnilistType === "MANGA"
                  ? "bg-brand text-white shadow-md shadow-brand/20"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}>
              Manga
            </button>
          </div>
        </div>
      )}

      {/* TVmaze: TV Shows Only indicator */}
      {isTvmaze && (
        <div className="ml-2 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/60 border border-purple-500/20 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
            TV Shows & Web Series Catalog
          </span>
        </div>
      )}

      {/* Watchmode: Streaming Availability Provider Indicator */}
      {isWatchmode && (
        <div className="ml-2 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/60 border border-cyan-500/20 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
            Watchmode Universal Catalog
          </span>
        </div>
      )}

      {/* AniList: Anime & Manga Provider Indicator */}
      {isAnilist && (
        <div className="ml-2 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-800/60 border border-pink-500/20 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse"></span>
          <span className="text-xs font-bold text-pink-300 uppercase tracking-wider">
            AniList Database
          </span>
        </div>
      )}

      {/* OMDb: Provider Indicator */}
      {isOmdb && (
        <div className="ml-2 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-800/60 border border-amber-500/20 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            OMDb & IMDb Database
          </span>
        </div>
      )}

      {/* OMDb Filters: 1st Type, 2nd Title, 3rd Year, 4th IMDb ID */}
      {isOmdb ? (
        <div className="space-y-4 ml-2">
          {/* 1st: Type Toggle */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
              Type Filter
            </label>
            <div className="flex rounded-xl overflow-hidden border border-white/10 bg-dark-body1 p-0.5">
              <button
                type="button"
                onClick={() => updateRoute("type", "")}
                className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider transition-all rounded-lg ${
                  !searchParams.get("type")
                    ? "bg-brand text-white shadow-md"
                    : "text-white/50 hover:text-white/80"
                }`}>
                All
              </button>
              <button
                type="button"
                onClick={() => updateRoute("type", "movie")}
                className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider transition-all rounded-lg ${
                  searchParams.get("type") === "movie"
                    ? "bg-brand text-white shadow-md"
                    : "text-white/50 hover:text-white/80"
                }`}>
                Movies
              </button>
              <button
                type="button"
                onClick={() => updateRoute("type", "series")}
                className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider transition-all rounded-lg ${
                  searchParams.get("type") === "series"
                    ? "bg-brand text-white shadow-md"
                    : "text-white/50 hover:text-white/80"
                }`}>
                Series
              </button>
            </div>
          </div>

          {/* 2nd: Title Search Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
              Title Search
            </label>
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
                onFocus={() => {
                  isSearchFocusedRef.current = true;
                }}
                onBlur={() => {
                  isSearchFocusedRef.current = false;
                }}
                onChange={handleTitleSearchChange}
                className="w-full pl-11 pr-4 py-2.5 rounded-full border border-white/20 bg-dark-body1 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-white/30 text-sm"
                placeholder="Search movie or TV title..."
              />
            </div>
          </div>

          {/* 3rd: Release Year Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
              Release Year
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xs font-bold text-white/40 pointer-events-none">
                📅
              </span>
              <input
                type="number"
                min="1900"
                max="2030"
                value={yearQuery}
                onFocus={() => {
                  isYearFocusedRef.current = true;
                }}
                onBlur={() => {
                  isYearFocusedRef.current = false;
                }}
                onChange={handleYearSearchChange}
                className="w-full pl-11 pr-4 py-2.5 rounded-full border border-white/20 bg-dark-body1 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-white/30 text-sm font-mono"
                placeholder="e.g. 2024"
              />
            </div>
          </div>

          {/* 4th: IMDb ID Search Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
              IMDb ID Search
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xs font-mono font-bold text-amber-400 pointer-events-none">
                id
              </span>
              <input
                type="search"
                value={imdbIdQuery}
                onFocus={() => {
                  isImdbFocusedRef.current = true;
                }}
                onBlur={() => {
                  isImdbFocusedRef.current = false;
                }}
                onChange={handleImdbIdSearchChange}
                className="w-full pl-11 pr-4 py-2.5 rounded-full border border-white/20 bg-dark-body1 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-white/30 text-sm font-mono"
                placeholder="e.g. tt1375666"
              />
            </div>
          </div>
        </div>
      ) : (
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
              onFocus={() => {
                isSearchFocusedRef.current = true;
              }}
              onBlur={() => {
                isSearchFocusedRef.current = false;
              }}
              onChange={handleSearchChange}
              className="w-full pl-11 pr-4 py-2.5 rounded-full border border-white/20 bg-dark-body1 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-white/30 text-sm"
              placeholder={
                isAnilist
                  ? (activeAnilistType === "MANGA" ? "Search manga & novels..." : "Search anime series & movies...")
                  : isWatchmode
                    ? "Search titles on Watchmode..."
                    : isTvmaze
                      ? "Search TV shows & series..."
                      : isTV
                        ? "Search TV show title..."
                        : "Search movie title..."
              }
            />
          </div>
        </div>
      )}



      {/* ═══════════ Watchmode-specific Filters ═══════════ */}
      {isWatchmode && (
        <>
          {/* Watchmode: Content Type Dropdown */}
          <div className="flex flex-col space-y-2 ml-2">
            <label className="text-xs font-bold text-white/50 uppercase">
              Content Type
            </label>
            <Select
              id="wmContentTypeSelect"
              options={wmContentTypes}
              value={
                wmContentTypes.find((opt) => opt.value === activeWmType) ||
                wmContentTypes[0]
              }
              placeholder="Select content type..."
              isSearchable={false}
              menuPortalTarget={
                typeof document !== "undefined" ? document.body : null
              }
              menuPosition="fixed"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              unstyled
              classNames={selectClassNames}
              onChange={(selectedOption) =>
                updateRoute("wmType", selectedOption.value)
              }
            />
          </div>

          {/* Watchmode: Service Types Dropdown */}
          <div className="flex flex-col space-y-2 ml-2">
            <label className="text-xs font-bold text-white/50 uppercase">
              Service Type
            </label>
            <Select
              id="wmServiceTypeSelect"
              options={[
                { value: "", label: "All Service Types" },
                ...wmServiceTypes,
              ]}
              value={
                [
                  { value: "", label: "All Service Types" },
                  ...wmServiceTypes,
                ].find((opt) => opt.value === (searchParams.get("serviceTypes") || "")) || {
                  value: "",
                  label: "All Service Types",
                }
              }
              placeholder="Select service type..."
              isSearchable={false}
              menuPortalTarget={
                typeof document !== "undefined" ? document.body : null
              }
              menuPosition="fixed"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              unstyled
              classNames={selectClassNames}
              onChange={(selectedOption) =>
                updateRoute("serviceTypes", selectedOption.value)
              }
            />
          </div>

          {/* Watchmode: Streaming Services Chip Grid */}
          <StreamingServicePills
            activeRegion={activeRegion}
            selectedSourceIds={activeSourceIds}
            onToggleSourceId={(sourceId) => updateRoute("sourceIds", sourceId)}
          />

          {/* Watchmode: Sort By */}
          <div className="flex flex-col space-y-2 ml-2">
            <label className="text-xs font-bold text-white/50 uppercase">
              Sort By
            </label>
            <Select
              id="wmSortBySelect"
              options={wmSortOptions}
              value={
                wmSortOptions.find((opt) => opt.value === activeWmSortBy) ||
                wmSortOptions[1]
              }
              placeholder="Sort by..."
              isSearchable={false}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              menuPosition="fixed"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              unstyled
              classNames={selectClassNames}
              onChange={(selectedOption) =>
                updateRoute("sortBy", selectedOption.value)
              }
            />
          </div>

          {/* Watchmode: Release Year Slider */}
          <RangeSlider
            title="Release Year"
            min={1900}
            max={2026}
            step={1}
            lowValue={searchParams.get("yearStart") || 1900}
            highValue={searchParams.get("yearEnd") || 2026}
            onChange={(min, max) =>
              updateRange("yearStart", min, "yearEnd", max, 1900, 2026)
            }
          />

          {/* Watchmode: User Rating Slider (0-10) */}
          <RangeSlider
            title="User Rating"
            min={0}
            max={10}
            step={0.1}
            lowValue={searchParams.get("ratingLow") || 0}
            highValue={searchParams.get("ratingHigh") || 10}
            onChange={(min, max) =>
              updateRange("ratingLow", min, "ratingHigh", max, 0, 10)
            }
          />

          {/* Watchmode: Critic Score Slider (0-100%) */}
          <RangeSlider
            title="Critic Score"
            min={0}
            max={100}
            step={1}
            unit="%"
            lowValue={searchParams.get("criticLow") || 0}
            highValue={searchParams.get("criticHigh") || 100}
            onChange={(min, max) =>
              updateRange("criticLow", min, "criticHigh", max, 0, 100)
            }
          />
        </>
      )}

      {/* ═══════════ TVmaze-specific Filters ═══════════ */}
      {isTvmaze && (
        <>
          {/* TVmaze: Sort By */}
          <div className="flex flex-col space-y-2 ml-2">
            <label className="text-xs font-bold text-white/50 uppercase">
              Sort By
            </label>
            <Select
              id="sortBySelect"
              options={tvmazeSortByOptions}
              value={
                tvmazeSortByOptions.find((opt) => opt.value === activeTvmazeSortBy) ||
                tvmazeSortByOptions[0]
              }
              placeholder="Sort by..."
              isSearchable={false}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              menuPosition="fixed"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              unstyled
              classNames={selectClassNames}
              onChange={(selectedOption) =>
                updateRoute("sortBy", selectedOption.value)
              }
            />
          </div>

          {/* TVmaze: Show Status */}
          <div className="flex flex-col space-y-2 ml-2">
            <label className="text-xs font-bold text-white/50 uppercase">
              Show Status
            </label>
            <PillGroup
              options={showStatusOptions}
              activeValue={activeShowStatus}
              paramKey="showStatus"
            />
          </div>

          {/* TVmaze: Show Type */}
          <div className="flex flex-col space-y-2 ml-2">
            <label className="text-xs font-bold text-white/50 uppercase">
              Show Type
            </label>
            <PillGroup
              options={showTypeOptions}
              activeValue={activeShowType}
              paramKey="showType"
            />
          </div>

          {/* TVmaze: Country */}
          <div className="flex flex-col space-y-2 ml-2">
            <label className="text-xs font-bold text-white/50 uppercase">
              Country
            </label>
            <Select
              id="countrySelect"
              options={[{ value: "", label: "All Countries" }, ...countryOptions]}
              value={
                activeCountry
                  ? countryOptions.find((opt) => opt.value === activeCountry) || {
                      value: "",
                      label: "All Countries",
                    }
                  : { value: "", label: "All Countries" }
              }
              placeholder="Filter by country..."
              isSearchable
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              menuPosition="fixed"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              unstyled
              classNames={selectClassNames}
              onChange={(selectedOption) =>
                updateRoute("country", selectedOption.value)
              }
            />
          </div>
        </>
      )}

      {/* ═══════════ AniList-specific Filters ═══════════ */}
      {isAnilist && (
        <>
          {/* AniList: Curated Collection / Category */}
          <div className="flex flex-col space-y-2 ml-2">
            <label className="text-xs font-bold text-white/50 uppercase">
              Curated Category
            </label>
            <Select
              id="anilistCategorySelect"
              options={[{ value: "", label: "All Titles" }, ...anilistCategoryOptions]}
              value={
                activeCategory
                  ? anilistCategoryOptions.find((opt) => opt.value === activeCategory) || {
                      value: "",
                      label: "All Titles",
                    }
                  : { value: "", label: "All Titles" }
              }
              placeholder="Select category..."
              isSearchable={false}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              menuPosition="fixed"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              unstyled
              classNames={selectClassNames}
              onChange={(selectedOption) =>
                updateRoute("category", selectedOption.value)
              }
            />
          </div>



          {/* AniList: Season (Anime only) */}
          {activeAnilistType === "ANIME" && (
            <div className="flex flex-col space-y-2 ml-2">
              <label className="text-xs font-bold text-white/50 uppercase">
                Season
              </label>
              <Select
                id="anilistSeasonSelect"
                options={[{ value: "", label: "All Seasons" }, ...anilistSeasonOptions]}
                value={
                  activeSeason
                    ? anilistSeasonOptions.find((opt) => opt.value === activeSeason) || {
                        value: "",
                        label: "All Seasons",
                      }
                    : { value: "", label: "All Seasons" }
                }
                placeholder="Select season..."
                isSearchable={false}
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                menuPosition="fixed"
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
                unstyled
                classNames={selectClassNames}
                onChange={(selectedOption) =>
                  updateRoute("season", selectedOption.value)
                }
              />
            </div>
          )}

          {/* AniList: Format */}
          <div className="flex flex-col space-y-2 ml-2">
            <label className="text-xs font-bold text-white/50 uppercase">
              Format
            </label>
            <Select
              id="anilistFormatSelect"
              options={[{ value: "", label: "All Formats" }, ...anilistFormatOptions]}
              value={
                activeFormat
                  ? anilistFormatOptions.find((opt) => opt.value === activeFormat) || {
                      value: "",
                      label: "All Formats",
                    }
                  : { value: "", label: "All Formats" }
              }
              placeholder="Select format..."
              isSearchable={false}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              menuPosition="fixed"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              unstyled
              classNames={selectClassNames}
              onChange={(selectedOption) =>
                updateRoute("format", selectedOption.value)
              }
            />
          </div>

          {/* AniList: Airing / Publishing Status */}
          <div className="flex flex-col space-y-2 ml-2">
            <label className="text-xs font-bold text-white/50 uppercase">
              {activeAnilistType === "MANGA" ? "Publishing Status" : "Airing Status"}
            </label>
            <Select
              id="anilistStatusSelect"
              options={[{ value: "", label: "All Statuses" }, ...anilistStatusOptions]}
              value={
                activeStatus
                  ? anilistStatusOptions.find((opt) => opt.value === activeStatus) || {
                      value: "",
                      label: "All Statuses",
                    }
                  : { value: "", label: "All Statuses" }
              }
              placeholder="Select status..."
              isSearchable={false}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              menuPosition="fixed"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              unstyled
              classNames={selectClassNames}
              onChange={(selectedOption) =>
                updateRoute("status", selectedOption.value)
              }
            />
          </div>

          {/* AniList: Streaming On (Anime only) */}
          {activeAnilistType === "ANIME" && (
            <div className="flex flex-col space-y-2 ml-2">
              <label className="text-xs font-bold text-white/50 uppercase">
                Streaming On
              </label>
              <div className="flex flex-wrap gap-1.5 pt-1 max-h-40 overflow-y-auto custom-scrollbar">
                {anilistStreamingOptions.map((service) => {
                  const isActive = activeStreamingOn.includes(service);
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => updateRoute("streamingOn", service)}
                      className={`px-2.5 py-1 text-[11px] rounded-full border cursor-pointer transition-all duration-150 select-none font-medium ${
                        isActive
                          ? "bg-brand border-brand text-white shadow-sm"
                          : "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:bg-white/10"
                      }`}>
                      {service}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* AniList: Country of Origin */}
          <div className="flex flex-col space-y-2 ml-2">
            <label className="text-xs font-bold text-white/50 uppercase">
              Country of Origin
            </label>
            <Select
              id="anilistCountrySelect"
              options={[{ value: "", label: "All Countries" }, ...anilistCountryOptions]}
              value={
                activeAnilistCountry
                  ? anilistCountryOptions.find((opt) => opt.value === activeAnilistCountry) || {
                      value: "",
                      label: "All Countries",
                    }
                  : { value: "", label: "All Countries" }
              }
              placeholder="Select country..."
              isSearchable={false}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              menuPosition="fixed"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              unstyled
              classNames={selectClassNames}
              onChange={(selectedOption) =>
                updateRoute("country", selectedOption.value)
              }
            />
          </div>

          {/* AniList: Source Material */}
          <div className="flex flex-col space-y-2 ml-2">
            <label className="text-xs font-bold text-white/50 uppercase">
              Source Material
            </label>
            <Select
              id="anilistSourceSelect"
              options={[{ value: "", label: "All Sources" }, ...anilistSourceOptions]}
              value={
                activeSource
                  ? anilistSourceOptions.find((opt) => opt.value === activeSource) || {
                      value: "",
                      label: "All Sources",
                    }
                  : { value: "", label: "All Sources" }
              }
              placeholder="Select source..."
              isSearchable={false}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              menuPosition="fixed"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              unstyled
              classNames={selectClassNames}
              onChange={(selectedOption) =>
                updateRoute("source", selectedOption.value)
              }
            />
          </div>

          {/* AniList: Year Range Slider (1940 - 2027) */}
          <RangeSlider
            title="Year Range"
            min={1940}
            max={2027}
            step={1}
            lowValue={searchParams.get("yearStart") || 1940}
            highValue={searchParams.get("yearEnd") || 2027}
            onChange={(min, max) =>
              updateRange("yearStart", min, "yearEnd", max, 1940, 2027)
            }
          />

          {/* AniList: Episodes Range Slider (Anime only) */}
          {activeAnilistType === "ANIME" && (
            <RangeSlider
              title="Episodes"
              min={0}
              max={150}
              step={1}
              lowValue={searchParams.get("episodesMin") || 0}
              highValue={searchParams.get("episodesMax") || 150}
              onChange={(min, max) =>
                updateRange("episodesMin", min, "episodesMax", max, 0, 150)
              }
            />
          )}

          {/* AniList: Duration Range Slider (Anime only) */}
          {activeAnilistType === "ANIME" && (
            <RangeSlider
              title="Duration (mins)"
              min={0}
              max={170}
              step={5}
              unit="m"
              lowValue={searchParams.get("durationMin") || 0}
              highValue={searchParams.get("durationMax") || 170}
              onChange={(min, max) =>
                updateRange("durationMin", min, "durationMax", max, 0, 170)
              }
            />
          )}

          {/* AniList: Advanced Genre & Tag Filters (Accordion - Collapsed by Default) */}
          <div className="flex flex-col space-y-3 ml-2 pt-2 border-t border-white/10">
            <button
              type="button"
              className="flex justify-between items-center w-full cursor-pointer group text-left"
              onClick={() => setIsAdvancedTagsOpen(!isAdvancedTagsOpen)}>
              <label className="text-xs font-bold text-white/70 uppercase tracking-wider cursor-pointer group-hover:text-white transition-colors flex items-center gap-1.5">
                <span>Advanced Genre & Tag Filters</span>
                {activeTags.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-brand/20 text-brand border border-brand/30">
                    {activeTags.length}
                  </span>
                )}
              </label>
              <span className="text-white/40 group-hover:text-white transition-colors text-sm font-mono">
                {isAdvancedTagsOpen ? "−" : "+"}
              </span>
            </button>

            {isAdvancedTagsOpen && (
              <div className="flex flex-col space-y-4 pt-1 animate-in slide-in-from-top-2 duration-300">
                {tagsArr && tagsArr.length > 0 ? (
                  tagsArr.map((group) => (
                    <div key={group.category} className="flex flex-col space-y-1.5">
                      <span className="text-[10px] font-bold text-brand uppercase tracking-wider">
                        {group.category}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {group.tags.map((tagName) => {
                          const isActive = activeTags.includes(tagName);
                          return (
                            <button
                              key={tagName}
                              type="button"
                              onClick={() => updateRoute("tag", tagName)}
                              className={`px-2 py-0.5 text-[10px] rounded-md border cursor-pointer transition-all duration-150 select-none ${
                                isActive
                                  ? "bg-brand border-brand text-white font-semibold shadow-sm"
                                  : "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:bg-white/10"
                              }`}>
                              {tagName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-white/40 italic py-2">
                    Loading advanced tags...
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════ Shared Filters ═══════════ */}

      {/* 2. Language dropdown (TMDB & TVmaze) */}
      {!isAnilist && !isOmdb && (
        <div className="flex flex-col space-y-2 ml-2">
          <label className="text-xs font-bold text-white/50 uppercase">
            Language
          </label>
          <Select
            id="languageSelect"
            options={currentLanguageOptions}
            value={defaultValue}
            placeholder="Search and select language"
            isSearchable
            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
            menuPosition="fixed"
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
            unstyled
            classNames={selectClassNames}
            onChange={(selectedOption) =>
              updateRoute("lang", selectedOption.value)
            }
          />
        </div>
      )}

      {/* 3. OTT Region dropdown (TMDB & Watchmode) */}
      {!isTvmaze && !isAnilist && !isOmdb && (
        <div className="flex flex-col space-y-2 ml-2">
          <label className="text-xs font-bold text-white/50 uppercase">
            OTT Region
          </label>
          <Select
            id="regionSelect"
            options={isWatchmode ? wmRegionOptions : regionOptions}
            value={
              (isWatchmode ? wmRegionOptions : regionOptions).find(
                (opt) => opt.value === activeRegion,
              ) || defaultRegion
            }
            placeholder="Select OTT region"
            isSearchable
            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
            menuPosition="fixed"
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
            unstyled
            classNames={selectClassNames}
            onChange={(selectedOption) =>
              updateRoute("region", selectedOption.value)
            }
          />
        </div>
      )}

      {/* 4. Watch Option - Monetization Type (TMDB only) */}
      {!isTvmaze && !isWatchmode && !isAnilist && !isOmdb && (
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
      )}

      {/* 5. Genres - Toggleable (TMDB, TVmaze, Watchmode, AniList) */}
      {!isOmdb && genresArr && genresArr.length > 0 && (
        <div className="flex flex-col space-y-3 ml-2 pt-2 border-t border-white/10">
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
            <div className="flex flex-wrap gap-2 animate-in slide-in-from-top-2 duration-300">
              {genresArr.map((genre) => {
                const genreKey = String(genre.id);
                const isActive = selectedGenres.includes(genreKey);
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
                      onChange={() => updateRoute("genre", genreKey)}
                    />
                    {genre.name}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. Top Rated (TMDB only) */}
      {!isTvmaze && !isWatchmode && !isAnilist && !isOmdb && (
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
      )}
    </aside>
  );
}
