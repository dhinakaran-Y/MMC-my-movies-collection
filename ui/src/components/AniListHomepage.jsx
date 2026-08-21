"use client";

import Link from "next/link";
import MovieCard from "./MovieCard";

function CuratedRow({ title, items = [], viewAllSort, type = "ANIME" }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="flex flex-col space-y-3 mb-6">
      {/* Row Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
          <span className="w-1.5 h-4 bg-brand rounded-full inline-block"></span>
          {title}
        </h2>
        {viewAllSort && (
          <Link
            href={`?provider=anilist&type=${type}&sortBy=${viewAllSort}`}
            className="text-xs font-semibold text-white/50 hover:text-brand transition-colors flex items-center gap-1 group">
            View All
            <span className="group-hover:translate-x-0.5 transition-transform inline-block">
              →
            </span>
          </Link>
        )}
      </div>

      {/* Horizontal Scroll Grid */}
      <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-3 pt-1 px-1">
        {items.map((item) => (
          <div
            key={item.storedId || `anilist-${item.id}`}
            className="w-[150px] sm:w-[170px] shrink-0">
            <MovieCard movie={item} provider="anilist" mediaType={type === "MANGA" ? "manga" : "tv"} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AniListHomepage({ rows = {}, type = "ANIME" }) {
  const isManga = type === "MANGA";
  const seasonInfo = rows.seasonInfo || {};

  const currentSeasonLabel = seasonInfo.currentSeason
    ? `${seasonInfo.currentSeason} ${seasonInfo.currentYear}`
    : "THIS SEASON";
  const nextSeasonLabel = seasonInfo.nextSeason
    ? `${seasonInfo.nextSeason} ${seasonInfo.nextYear}`
    : "NEXT SEASON";

  return (
    <main className="col-span-full lg:col-span-9 lg:h-full lg:overflow-y-auto p-5 custom-scrollbar">
      {/* Curated Sections */}
      <CuratedRow
        title="TRENDING NOW"
        items={rows.trendingNow}
        viewAllSort="TRENDING_DESC"
        type={type}
      />

      <CuratedRow
        title={isManga ? "HIGHEST RATED MANGA" : `POPULAR ${currentSeasonLabel}`}
        items={rows.popularThisSeason}
        viewAllSort={isManga ? "SCORE_DESC" : "POPULARITY_DESC"}
        type={type}
      />

      <CuratedRow
        title={isManga ? "POPULAR PUBLISHING" : `UPCOMING ${nextSeasonLabel}`}
        items={rows.upcomingNextSeason}
        viewAllSort="POPULARITY_DESC"
        type={type}
      />

      <CuratedRow
        title="ALL TIME POPULAR"
        items={rows.allTimePopular}
        viewAllSort="POPULARITY_DESC"
        type={type}
      />

      <CuratedRow
        title={isManga ? "TOP 100 MANGA" : "TOP 100 ANIME"}
        items={rows.top100}
        viewAllSort="SCORE_DESC"
        type={type}
      />
    </main>
  );
}
