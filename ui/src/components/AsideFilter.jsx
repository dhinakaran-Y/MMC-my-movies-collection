"use client";

import { useSearchParams, useRouter } from "next/navigation";
import FilteredLanguagesArr from "@/data/FilteredLanguagesArr.json";
import dynamic from "next/dynamic";
import { useState } from "react";

const Select = dynamic(() => import("react-select"), { ssr: false });

export default function AsideFilter({
  genresArr = [],
  currentLang,
  currentGenre,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isGenresOpen, setIsGenresOpen] = useState(true); // Toggle State

  const languageOptions = [
    { value: "", label: "All Languages" },
    ...FilteredLanguagesArr.map((l) => ({
      value: l.language,
      label: l.languageName,
    })),
  ];

  const defaultValue =
    languageOptions.find((opt) => opt.value === currentLang) ||
    languageOptions[0];

  const updateRoute = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());

    if (key === "query") {
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
      if (value && value !== "") params.set(key, value);
      else params.delete(key);
    }

    params.delete("page");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const selectedGenres = searchParams.get("genre")?.split(",") || [];

  return (
    <aside className="col-span-3 bg-dark-body2 p-5 pt-10 flex flex-col space-y-8 h-full border-r border-white/5">
      <div className="flex justify-between px-3 items-baseline">
        <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">
          Filters
        </span>
        <button
          onClick={() => router.push("/")}
          className="text-xs font-light text-brand hover:underline">
          Reset All
        </button>
      </div>

      {/* 1. search bar */}
      <div className="space-y-2">
        <input
          type="search"
          defaultValue={searchParams.get("query") || ""}
          className="w-full px-4 py-2.5 rounded-full border border-white/20 bg-dark-body1 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-white/30 text-sm"
          placeholder="Search movie title..."
          onKeyDown={(e) => {
            if (e.key === "Enter") updateRoute("query", e.target.value);
          }}
        />
      </div>

      {/* 2. language dropdown */}
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
          unstyled
          classNames={{
            control: ({ isFocused }) =>
              `bg-slate-800 text-white p-1 rounded-xl border transition-all ${
                isFocused ? "border-brand ring-1 ring-brand" : "border-white/10"
              } cursor-pointer text-sm`,
            menu: () =>
              "bg-slate-800 border border-white/10 rounded-xl mt-2 overflow-hidden shadow-2xl z-10",
            option: ({ isFocused, isSelected }) =>
              `px-3 py-2 cursor-pointer transition-colors ${
                isSelected
                  ? "bg-brand text-white"
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

      {/* 3. Genres - Toggleable */}
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

      {/* 4. top Rated */}
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
