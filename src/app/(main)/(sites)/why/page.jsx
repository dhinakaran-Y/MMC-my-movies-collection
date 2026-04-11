export const metadata = {
  title: "About MMC | My Movies Collection",
  description:
    "Discover the technology and mission behind MMC - the ultimate personal movie library powered by TMDB.",
};

export default function AboutPage() {
  const features = [
    {
      title: "Personal Watchlist",
      desc: "Save movies you want to watch and keep your library organized in one place.",
      icon: "📑",
    },
    {
      title: "The Real time current data",
      desc: "We provides daily movie updates you can search world wide new released movies",
      icon: "📽️",
    },
    {
      title: "Share with your friends",
      desc: "You can share your movies collections to your friends.",
      icon: "👥",
    },
    // {
    //   title: "Smart Discovery",
    //   desc: "Filter by 100+ languages and specific genres and top ratings to find movies on your mood swing.",
    //   icon: "🔍",
    // },
  ];

  return (
    <div className="min-h-screen bg-dark-body1 text-white">
      {/* hero section */}
      <section className="pb-20 pt-8 px-6 text-center max-w-4xl mx-auto space-y-6">
        <h1 className="text-5xl font-extrabold italic tracking-tighter">
          Why <span className="text-brand">MMC?</span>
        </h1>
        <p className="text-white/60 text-lg leading-relaxed">
          My Movies Collection (MMC) was built for the cinema lovers who had
          bunch of movie names as a collection in their notes . We provide a
          clean, focused space to explore, filter, and create your personal
          movie collections and share with your friends.
        </p>
      </section>

      {/* features grid */}
      <section className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8 mb-20">
        {features.map((f, i) => (
          <div
            key={i}
            className="bg-dark-body2 border border-white/5 p-8 rounded-3xl hover:border-brand/30 transition-all group">
            <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform">
              {f.icon}
            </span>
            <h3 className="text-xl font-bold mb-2">{f.title}</h3>
            <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* TMDB info */}
      <section className="bg-dark-body2 border-y border-white/5 py-16 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">
            Where we get the data?
          </h2>
          <p className="text-white/50 text-sm leading-loose">
            MMC get all data from{" "}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand font-bold hover:underline">
              TMDB API
            </a>{" "}
            (The Movies Database). All movie metadata, including posters,
            ratings, and description, are sourced dynamically from their
            community-driven database to provide you with the most accurate
            information.
          </p>
        </div>
      </section>


    </div>
  );
}
