"use client"; 

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function Pagination({ currentPage, totalPages }) {

  // for grab path
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber) => {
    // create new path with the old grabbed path(searchParams)
    const params = new URLSearchParams(searchParams.toString());
    params.set("page",pageNumber.toString())
    return `?${params.toString()}`
  }


  return (
    <div className="flex items-center justify-center space-x-2 py-10">
      {/* previous btn */}
      {currentPage > 1 && (
        <Link
          href={createPageURL(currentPage - 1)}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white/70 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          Pre
        </Link>
      )}

      {/* page info */}
      <span className="flex items-center space-x-1 px-4">
        <span className="text-orange-600 font-mono font-bold text-lg">
          {currentPage}
        </span>{" "}
        <span className="text-white/40">/</span>{" "}
        <span className="text-white/60 font-mono">{totalPages}</span>
      </span>

      {/* next Btn */}
      {currentPage < totalPages && (
        <Link
          href={createPageURL(currentPage + 1)}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white/70 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          Next
        </Link>
      )}
    </div>
  );
}

