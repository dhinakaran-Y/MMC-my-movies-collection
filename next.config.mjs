/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

export default nextConfig;