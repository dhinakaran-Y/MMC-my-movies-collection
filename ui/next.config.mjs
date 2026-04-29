import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// const proxyUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
    ],
  },
  // async rewrites() {
  //   return [
  //     {
  //       source: '/tmdb-api/:path*',
  //       destination: 'https://api.themoviedb.org/3/:path*',
  //     },
  //   ];
  // },
  // async rewrites() {
  //   return {
  //     afterFiles: [
  //       {
  //         source: "/api/:path*",
  //         destination: `${proxyUrl}/:path*`, // Proxy to Backend
  //       },
  //     ],
  //   };
  // },

  
};

export default nextConfig;
