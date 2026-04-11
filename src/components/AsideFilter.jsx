"use client";

import { useSearchParams, useRouter } from "next/navigation";
import FilteredLanguagesArr from "@/data/FilteredLanguagesArr.json";
// import Select from "react-select/base";
import dynamic from "next/dynamic";
// Import Select dynamically to prevent SSR issues
const Select = dynamic(() => import("react-select"), { ssr: false });

export default function AsideFilter({
  // languagesArr = [],
  genresArr = [],
  currentLang,
  currentGenre,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // language Options Arr
  const languageOptions = [
    { value: "", label: "All Languages" },
    ...FilteredLanguagesArr.map((l) => ({
      value: l.language,
      label: l.languageName,
    })),
  ];

  // console.log(languageOptions);

  // find current selected language based on url
  const defaultValue =
    languageOptions.find((opt) => opt.value === currentLang) ||
    languageOptions[0];

  const updateRoute = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());

    // 1.searching by query
    if (key === "query") {
      // Clear all other filters to get broad search results
      params.delete("lang");
      params.delete("topRated");
      params.delete("genre");

      if (value) params.set("query", value);
      else params.delete("query");
    }

    // 2.genre
    else if (key === "genre") {
      params.delete("query"); // Clear search

      //
      const currentGenres = params.get("genre")
        ? params
            .get("genre")
            .split(",")
            .filter((id) => id !== "")
        : [];

      if (currentGenres.includes(value)) {
        // uncheck - remove
        const filtered = currentGenres.filter((id) => id !== value);
        if (filtered.length > 0) params.set("genre", filtered.join(","));
        else params.delete("genre");
      } else {
        // check - Add
        const newGenres = [...currentGenres, value];
        params.set("genre", newGenres.join(","));
      }
    }

    // 3.language or top rated
    else {
      params.delete("query"); // Clear search when filtering
      if (value && value !== "") params.set(key, value);
      else params.delete(key);
    }

    // reset
    params.delete("page");

    // push new URL
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // check if a specific genre ID in the URL
  const selectedGenres = searchParams.get("genre")?.split(",") || [];

  return (
    <aside className="col-span-3 bg-dark-body2 p-5 pt-10 flex flex-col space-y-8 h-full border-r border-white/5">
      {/* Header & Reset */}
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
          // Use unstyled to remove default React Select borders/colors
          unstyled
          classNames={{
            control: ({ isFocused }) =>
              `bg-slate-800 text-white p-1 rounded-xl border transition-all ${
                isFocused ? "border-brand ring-1 ring-brand" : "border-white/10"
              } cursor-pointer text-sm`,
            menu: () =>
              "bg-slate-800 border border-white/10 rounded-xl mt-2 overflow-hidden shadow-2xl",
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
            clearIndicator: () => "text-white/40 hover:text-brand px-2",
            noOptionsMessage: () => "text-white/40 p-4",
          }}
          onChange={(selectedOption) =>
            updateRoute("lang", selectedOption.value)
          }
        />
      </div>
      {/* 2.2. old language dropdown */}
      {/* <div className="flex flex-col space-y-2 ml-2">
        <label className="text-xs font-bold text-white/50 uppercase">
          Language
        </label>
        <select
          value={currentLang || ""}
          onChange={(e) => updateRoute("lang", e.target.value)}
          className="bg-slate-800 text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-brand cursor-pointer text-sm">
          <option value="">All Languages</option>
          {languagesArr.map((l) => (
            <option key={l.iso_639_1} value={l.iso_639_1}>
              {l.english_name}
            </option>
          ))}
        </select>
      </div> */}

      {/* 3. genres*/}
      <div className="flex flex-col space-y-3 ml-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-white/50 uppercase">
            Genres
          </label>
          {/* {selectedGenres.length > 0 && (
            <button
              onClick={() => updateRoute("genre", "")}
              className="text-[10px] text-brand hover:underline">
              Clear
            </button>
          )} */}
        </div>
        <div className="flex flex-wrap gap-2 max-h-75 overflow-y-auto custom-scrollbar pr-2">
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
