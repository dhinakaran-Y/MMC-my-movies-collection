import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const proxyUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname, // absolute path to ui folder
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.marvel.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.themoviedb.org",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "static.tvmaze.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s4.anilist.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "anilist.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ia.media-imdb.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return {
      // Ensure Next.js API routes are NOT proxied to the Express backend
      beforeFiles: [
        { source: "/api/omdb/:path*", destination: "/api/omdb/:path*" },
        { source: "/api/tmdb/:path*", destination: "/api/tmdb/:path*" },
        { source: "/api/anilist/:path*", destination: "/api/anilist/:path*" },
        { source: "/api/tvmaze/:path*", destination: "/api/tvmaze/:path*" },
        { source: "/api/watchmode/:path*", destination: "/api/watchmode/:path*" },
      ],
      afterFiles: [
        {
          source: "/api/:path*",
          destination: `${proxyUrl}/:path*`, // Proxy to Backend
        },
      ],
    };
  },
};

export default nextConfig;