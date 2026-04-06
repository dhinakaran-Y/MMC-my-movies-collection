"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function CollectionMovieCard({ movie }) {
  const API_KEY = "3472ccb0d97ebc192cbd0e56bd799736";
  const [providers, setProviders] = useState([]);
  const [poster, setPoster] = useState(
    `https://media.themoviedb.org/t/p/w600_and_h900_face/${movie.poster_path}`,
  );

  useEffect(() => {
    async function getMovieProviders(movieId) {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${API_KEY}`,
      );
      const data = await res.json();
      const flatRateArr = data.results?.IN?.flatrate || [];
      const watchPage = data.results?.IN?.link;

      // console.log(flatRateArr, watchPage);
      setProviders(flatRateArr);
    }

    getMovieProviders(movie.id);
  }, [movie.id]);

  return (
    <div className="brightness-70 relative">
      <Image
        src={poster}
        alt={movie.title}
        className="h-full object-center brightness-75 object-cover w-full"
        width={500}
        height={750}
        loading="eager"
        onError={() => setPoster("/fallbackImg.png")}
      />

      {/* hover - div */}
      <div className="absolute flex-col space-y-3 text-white/90 font-semibold bg-black/80 top-0 right-0 left-0 bottom-0 flex items-center justify-center opacity-0 text-div hover:opacity-100 transition-all duration-300">
        {/* title */}
        <h1 className="text-orange-600/70 capitalize font-semibold text-center text-3xl font-mono">
          {movie.title ?? movie.title}
        </h1>
        {/* disc */}
        <p className="w-[90%] line-clamp-3">
          {movie.overview ?? movie.overview}
        </p>
        {/* rating */}
        {movie.vote_average > 0 && (
          <div className="flex space-x-1 justify-center items-center">
            <span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1.5em"
                height="1.5em"
                viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  className="fill-yellow1/80"
                  d="m8.125 7.092l2.608-3.47q.238-.322.566-.472T12 3t.701.15t.566.471l2.608 3.471l4.02 1.368q.534.18.822.605q.289.426.289.94q0 .237-.07.471t-.228.449l-2.635 3.573l.1 3.83q.025.706-.466 1.189T16.564 20l-.454-.056L12 18.733l-4.11 1.211q-.124.05-.24.053q-.117.003-.214.003q-.665 0-1.15-.483t-.459-1.188l.1-3.856l-2.629-3.548q-.159-.217-.229-.453Q3 10.236 3 10q0-.506.297-.942q.296-.435.828-.618zm.629.86L4.462 9.398q-.289.096-.395.394t.087.548l2.792 3.84l-.119 4.16q-.02.327.23.52q.25.192.559.096L12 17.696l4.385 1.285q.307.096.557-.096q.25-.193.231-.52l-.12-4.184l2.793-3.79q.192-.25.087-.549q-.106-.298-.395-.394l-4.292-1.496l-2.765-3.683q-.173-.25-.481-.25t-.48.25zM12 11.519"
                />
              </svg>
            </span>
            <span className="text-yellow1/60 text-sm">
              {movie.vote_average.toFixed(1)}
            </span>
          </div>
        )}
        {/*OTT Platforms */}
        <div className="p-5 text-center">
          {providers.length > 0 && (
            <p className="text-white text-sm font-bold mb-2">Available on:</p>
          )}
          <div className="flex gap-2 justify-center flex-wrap">
            {providers.length > 0 ? (
              providers.map((p) => (
                <Image
                  key={p.provider_id}
                  src={`https://media.themoviedb.org/t/p/original${p.logo_path}`}
                  alt={p.provider_name}
                  title={p.provider_name}
                  className="rounded-md border border-white/20"
                  width={40}
                  height={40}
                />
              ))
            ) : (
              <span className="text-white/70 text-xs">
                Streaming Platforms data are not available
              </span>
            )}
          </div>
        </div>
        {/* action */}
        <div className="absolute bottom-10 grid grid-cols-2 gap-5">
          {/* add to watched */}
          <button
            type="button"
            className="flex cursor-pointer items-center bg-blue1/80 hover:bg-blue-600 justify-center space-x-1 rounded py-2 px-2 active:scale-105 transition-all duration-300">
            <span>
              {/* watched */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24">
                <g
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5">
                  <path d="M12 14a2 2 0 1 0 0-4a2 2 0 0 0 0 4Z" />
                  <path d="M21 12c-1.889 2.991-5.282 6-9 6s-7.111-3.009-9-6c2.299-2.842 4.992-6 9-6s6.701 3.158 9 6Z" />
                </g>
              </svg>
              {/* unwatch */}
              {/* <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><path d="m3 3l18 18M10.5 10.677a2 2 0 0 0 2.823 2.823" /><path d="M7.362 7.561C5.68 8.74 4.279 10.42 3 12c1.889 2.991 5.282 6 9 6c1.55 0 3.043-.523 4.395-1.35M12 6c4.008 0 6.701 3.158 9 6a15.66 15.66 0 0 1-1.078 1.5" /></g></svg> */}
            </span>
            <span className="text-sm">Add Watched</span>
          </button>
          {/* add to collection */}
          <button
            type="button"
            className="flex cursor-pointer items-center justify-center space-x-1 bg-red1/80 hover:bg-red-600 rounded py-2 px-2 active:scale-105 transition-all duration-300">
            <span>
              {/* add collection */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M6 6.2c0-1.12 0-1.68.218-2.108a2 2 0 0 1 .874-.874C7.52 3 8.08 3 9.2 3h5.6c1.12 0 1.68 0 2.108.218a2 2 0 0 1 .874.874C18 4.52 18 5.08 18 6.2v13.305c0 .486 0 .729-.101.862a.5.5 0 0 1-.37.198c-.167.01-.369-.125-.773-.394L12 17l-4.756 3.17c-.404.27-.606.405-.774.395a.5.5 0 0 1-.369-.198C6 20.234 6 19.991 6 19.505z"
                />
              </svg>
              {/* added collection */}
              {/* <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M6 6.2c0-1.12 0-1.68.218-2.108a2 2 0 0 1 .874-.874C7.52 3 8.08 3 9.2 3h5.6c1.12 0 1.68 0 2.108.218a2 2 0 0 1 .874.874C18 4.52 18 5.08 18 6.2v13.305c0 .486 0 .729-.101.862a.5.5 0 0 1-.37.198c-.167.01-.369-.125-.773-.394L12 17l-4.756 3.17c-.404.27-.606.405-.774.395a.5.5 0 0 1-.369-.198C6 20.234 6 19.991 6 19.505z"
                />
              </svg> */}
            </span>
            <span className="text-sm" title="remove movie from this collection">
              Remove
            </span>
          </button>
        </div>
        {/* adult */}
        {/* <div className="absolute top-5 right-3">
          {console.log(movie.adult)}
          <span className="text-yellow1/80">{movie.adult && "18+"}</span>
        </div> */}
      </div>
    </div>
  );
}
