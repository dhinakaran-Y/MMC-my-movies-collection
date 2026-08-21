"use client";

import { useEffect, useState, useMemo } from "react";
import watchmodeEnums from "@/data/watchmodeEnums.json";

export default function StreamingServicePills({
  activeRegion = "US",
  selectedSourceIds = [],
  onToggleSourceId,
}) {
  const [sources, setSources] = useState(
    watchmodeEnums.topStreamingSources || [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const regionToFetch = activeRegion || "US";

    // Fetch sources specifically for active region so only providers with data (> 0 movies) are displayed
    fetch(`/api/watchmode/sources?region=${regionToFetch}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const groupedMap = new Map();
          for (const s of data) {
            if (!s || !s.name) continue;
            const cleanName = s.name.trim();
            const key = cleanName.toLowerCase();
            const rawId = String(s.id);
            const idList = rawId.includes(",") ? rawId.split(",") : [rawId];

            if (!groupedMap.has(key)) {
              groupedMap.set(key, {
                id: rawId,
                ids: idList,
                name: cleanName,
                type: s.type,
              });
            } else {
              const existing = groupedMap.get(key);
              for (const id of idList) {
                if (!existing.ids.includes(id)) {
                  existing.ids.push(id);
                }
              }
              existing.id = existing.ids.join(",");
              if (s.type === "sub" || (s.type === "free" && existing.type === "tve")) {
                existing.type = s.type;
              }
            }
          }

          const unique = Array.from(groupedMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          setSources(unique);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSources(watchmodeEnums.topStreamingSources || []);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeRegion]);

  const filteredSources = useMemo(() => {
    if (!searchQuery.trim()) return sources;
    const q = searchQuery.toLowerCase().trim();
    return sources.filter((s) => s.name.toLowerCase().includes(q));
  }, [sources, searchQuery]);

  return (
    <div className="flex flex-col space-y-2 ml-2">
      {/* Header with Accordion toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between group cursor-pointer">
        <label className="text-xs font-bold text-white/50 uppercase cursor-pointer group-hover:text-white/80 transition-colors">
          Streaming Services{" "}
          <span className="text-brand font-semibold lowercase">
            ({sources.length})
          </span>
        </label>
        <div className="flex items-center gap-1.5">
          {selectedSourceIds.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand/30 text-brand border border-brand/40">
              {selectedSourceIds.length} selected
            </span>
          )}
          <svg
            className={`w-4 h-4 text-white/50 group-hover:text-white transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="flex flex-col space-y-2 pt-1 animate-in fade-in duration-150">
          {/* Quick Search within streaming platforms */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${sources.length} streaming platforms...`}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-white/10 bg-slate-950/70 text-white placeholder:text-white/30 focus:border-brand focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs">
                ✕
              </button>
            )}
          </div>

          {/* 2-Column Grid of Text Buttons (Exact Official Website Style) */}
          <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto custom-scrollbar p-1 pr-1.5">
            {filteredSources.length > 0 ? (
              filteredSources.map((source) => {
                const sourceKey = String(source.id);
                const sourceIdsList = source.ids || sourceKey.split(",");
                const isSelected = sourceIdsList.some((id) =>
                  selectedSourceIds.includes(String(id))
                );

                return (
                  <button
                    key={`wm-src-${source.name}-${source.id}`}
                    type="button"
                    onClick={() => onToggleSourceId(sourceKey)}
                    title={source.name}
                    className={`min-h-[50px] px-2.5 py-2 rounded-xl border flex items-center justify-center text-center transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-brand/20 border-brand text-brand font-bold shadow-sm shadow-brand/20 ring-1 ring-brand/40"
                        : "bg-slate-900/80 hover:bg-slate-800/90 border-white/10 hover:border-white/20 text-white/80"
                    }`}>
                    <span className="text-[11px] sm:text-xs font-medium leading-snug break-words line-clamp-2 select-none">
                      {source.name}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="col-span-2 py-6 text-center text-xs text-white/40">
                No matching streaming platform found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
