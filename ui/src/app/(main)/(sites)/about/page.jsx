import Link from "next/link";
import {
  Film,
  Sparkles,
  Tv,
  Eye,
  CheckCircle2,
  Share2,
  SlidersHorizontal,
  ShieldCheck,
  Zap,
  Globe,
  Database,
  ArrowRight,
  Layers,
  Star,
  ExternalLink,
  BookOpen,
  Clapperboard,
  PlaySquare
} from "lucide-react";

export const metadata = {
  title: "About MMC | The All-in-One Entertainment Collection Hub",
  description:
    "Learn about MMC (My Movies Collection) — uniting TMDB, AniList, TVmaze, Watchmode, and OMDb/IMDb into one unified, ad-free cinema & anime hub.",
};

const PROVIDERS = [
  {
    id: "tmdb",
    name: "TMDB",
    fullName: "The Movie Database",
    badge: "Global Cinema",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: Film,
    desc: "Worldwide movie & TV show metadata, top trending charts, official trailers, casting details, and high-resolution posters & backdrops.",
    features: ["Global Box Office & Releases", "Official YouTube Trailers", "Cast, Crew & Bios", "Trending & Popularity Metrics"],
    link: "https://www.themoviedb.org/",
  },
  {
    id: "anilist",
    name: "AniList",
    fullName: "AniList GraphQL Engine",
    badge: "Anime & Manga",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    icon: Sparkles,
    desc: "Comprehensive Japanese anime and manga tracking with seasonal releases, airing countdowns, manga volumes, and nuanced genre tags.",
    features: ["Seasonal Anime Charts", "Manga & Light Novels", "Airing Status & Episode Counts", "Community Score Averages"],
    link: "https://anilist.co/",
  },
  {
    id: "tvmaze",
    name: "TVmaze",
    fullName: "TVmaze Broadcast Network",
    badge: "Television",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: Tv,
    desc: "Precision TV schedule and broadcast database. Track networks, premiere dates, runtime, status (running/ended), and episode breakdowns.",
    features: ["Broadcast Channels & Networks", "Running vs. Ended Status", "Airtimes & Schedules", "Country-Specific Programming"],
    link: "https://www.tvmaze.com/",
  },
  {
    id: "watchmode",
    name: "Watchmode",
    fullName: "Watchmode Streaming Catalog",
    badge: "OTT Finder",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    icon: PlaySquare,
    desc: "Real-time streaming availability across 200+ OTT services (Netflix, Prime Video, Disney+, Apple TV+, Hulu, Max) tailored to your country.",
    features: ["200+ Streaming Services", "Subscription, Rent & Buy Types", "Critic vs. User Score Sliders", "Granular Filter by Region"],
    link: "https://api.watchmode.com/",
  },
  {
    id: "omdb",
    name: "OMDb / IMDb",
    fullName: "Open Movie Database (IMDb)",
    badge: "Ratings & ID",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: Star,
    desc: "Official IMDb ratings, vote counts, awards data, and direct lookup using unique IMDb identifiers (e.g. tt1375666).",
    features: ["Official IMDb Ratings & Votes", "Direct IMDb ID Search", "Rotten Tomatoes & Metascore", "Box Office & Awards Info"],
    link: "https://www.omdbapi.com/",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Multi-Source Unified Catalog",
    mmc: "5-in-1 Hub (Movies, TV Series, Anime, Manga & OTT Availability)",
    others: "Fragmented across separate single-purpose websites",
  },
  {
    feature: "Where to Watch (OTT Streaming Finder)",
    mmc: "Accurate real-time streaming availability across 200+ services by country",
    others: "Often missing, outdated, or heavily pushes sponsored platforms",
  },
  {
    feature: "Anime & Manga Integration",
    mmc: "Dedicated seasonal anime charts, manga, airing countdowns & nuanced tags",
    others: "Incomplete coverage or requires a completely separate niche app",
  },
  {
    feature: "Ad-Free & Distraction-Free Experience",
    mmc: "100% Ad-Free with sleek, fast dark-mode glassmorphism",
    others: "Heavy banner ads, sponsored popups, autoplay video clips & gossip tabloids",
  },
  {
    feature: "Advanced Granular Filtering",
    mmc: "Filter simultaneously by OTT platforms, audio languages, score sliders & formats",
    others: "Basic & rigid filters, or locked behind expensive premium subscriptions",
  },
  {
    feature: "Custom Collections & Sharing",
    mmc: "Organize Watching, Plan to Watch, Completed, Custom lists & clean share links",
    others: "Basic linear watchlists without deep customization or easy sharing",
  },
  {
    feature: "TV Broadcast & Schedule Tracking",
    mmc: "Accurate network airtimes, episode breakdowns, and running/ended status",
    others: "Limited episode details with no real-time broadcast schedules",
  },
];

const CORE_BENEFITS = [
  {
    icon: Layers,
    title: "All Entertainment in One Single Place",
    desc: "Stop switching between separate sites for ratings, anime seasons, TV airtimes, and streaming availability. MMC unifies all of them in one place.",
  },
  {
    icon: Globe,
    title: "Regional OTT Streaming Discovery",
    desc: "Instantly know whether a movie or show is streaming on Netflix, Disney+, Prime Video, or Apple TV+ in your specific country.",
  },
  {
    icon: SlidersHorizontal,
    title: "Supercharged Smart Filtering",
    desc: "Filter by original audio language, release year ranges, minimum critic ratings, TV broadcast status, or seasonal anime format.",
  },
  {
    icon: CheckCircle2,
    title: "Personal Library & Status Tracking",
    desc: "Organize movies and shows into Watching, Completed, Plan to Watch, and Dropped with personal notes, custom ratings, and private/public collections.",
  },
  {
    icon: Share2,
    title: "Share Curated Lists with Friends",
    desc: "Easily share your customized collections with friends via clean, shareable collection links — perfect for movie night recommendations.",
  },
  {
    icon: Zap,
    title: "Fast, Ad-Free & Distraction-Free UI",
    desc: "No popup ads, no auto-playing promo clips, and no celebrity gossip tabloids. MMC is built purely for film and television lovers.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-dark-body1 text-white selection:bg-brand selection:text-white pb-24">
      {/* ── 1. Hero Section ── */}
      <section className="relative overflow-hidden pt-12 pb-20 px-6 sm:px-8 border-b border-white/5 bg-gradient-to-b from-dark-body2/80 via-dark-body1 to-dark-body1">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/10 border border-brand/25 text-brand text-xs font-bold uppercase tracking-wider shadow-lg shadow-brand/5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Modern Cinema & Series Hub</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            About <span className="text-brand italic">MMC</span>
          </h1>

          <p className="text-white/70 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
            <strong className="text-white">My Movies Collection (MMC)</strong> was created for cinema lovers, anime enthusiasts, and TV fans who were tired of keeping messy movie notes and switching across 5 different apps.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand hover:bg-red-700 text-white font-bold text-sm shadow-xl shadow-brand/20 transition-all hover:scale-105"
            >
              <Clapperboard className="w-4 h-4" />
              <span>Start Exploring</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/10 transition-all hover:scale-105"
            >
              <BookOpen className="w-4 h-4" />
              <span>My Collection</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. The 5-in-1 Multi-Database Ecosystem ── */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="text-xs font-bold text-brand uppercase tracking-widest">
            Connected Multi-Provider Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            5 Powerful Databases, 1 Unified Platform
          </h2>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed">
            MMC seamlessly pulls real-time information from the world&apos;s leading entertainment data providers to give you complete coverage of everything you watch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            return (
              <div
                key={provider.id}
                className="rounded-3xl bg-dark-body2 border border-white/10 hover:border-brand/40 p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-xl hover:shadow-2xl hover:shadow-brand/5 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${provider.badgeColor}`}>
                      {provider.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-brand transition-colors">
                    {provider.name}
                  </h3>
                  <div className="text-xs font-medium text-white/40 mb-3">
                    {provider.fullName}
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed mb-6">
                    {provider.desc}
                  </p>

                  <ul className="space-y-2 mb-6 border-t border-white/5 pt-4">
                    {provider.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-white/70">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={provider.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-between text-xs font-semibold text-white/50 hover:text-white pt-3 border-t border-white/10 transition-colors"
                >
                  <span>Visit {provider.name} Official</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. Why MMC? Core Features ── */}
      <section className="bg-dark-body2/60 border-y border-white/5 py-20 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="text-xs font-bold text-brand uppercase tracking-widest">
              Why You Should Use This App
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Engineered for True Media Lovers
            </h2>
            <p className="text-white/60 text-sm sm:text-base leading-relaxed">
              Experience movie tracking reimagined with speed, versatility, and clean design.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CORE_BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={i}
                  className="p-7 rounded-3xl bg-dark-body3/80 border border-white/5 hover:border-white/15 transition-all space-y-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {b.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4. Comparison Matrix: MMC vs. Other Platforms ── */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="text-xs font-bold text-brand uppercase tracking-widest">
            Platform Comparison
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            MMC vs. Other Platforms
          </h2>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed">
            See how MMC stacks up against traditional single-purpose websites and generic tracking apps.
          </p>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-dark-body2 shadow-2xl">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 sm:p-5 font-bold text-white uppercase tracking-wider w-1/4">
                  Feature & Capability
                </th>
                <th className="p-4 sm:p-5 font-bold text-brand uppercase tracking-wider bg-brand/10 border-x border-brand/20 w-5/12">
                  🔴 MMC (This App)
                </th>
                <th className="p-4 sm:p-5 font-semibold text-white/70 uppercase tracking-wider w-1/3">
                  ⚪ Other Platforms / Traditional Sites
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 sm:p-5 font-bold text-white/90">
                    {row.feature}
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-white bg-brand/5 border-x border-brand/15">
                    <span className="text-brand font-black mr-1.5">✓</span>
                    {row.mmc}
                  </td>
                  <td className="p-4 sm:p-5 text-white/50 leading-relaxed">
                    {row.others}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 5. Data Attribution / Open API Credits ── */}
      <section className="max-w-4xl mx-auto px-6 text-center space-y-6 pt-10">
        <div className="p-8 rounded-3xl bg-dark-body2 border border-white/5 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 text-white/70 mx-auto flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Data Attribution & Transparency
          </h3>
          <p className="text-xs text-white/50 leading-relaxed max-w-2xl mx-auto">
            MMC is a personal media library project developed for entertainment enthusiasts. All movie, anime, and TV show metadata, ratings, images, and streaming data are sourced via public APIs from <strong className="text-white">TMDB</strong>, <strong className="text-white">AniList</strong>, <strong className="text-white">TVmaze</strong>, <strong className="text-white">Watchmode</strong>, and <strong className="text-white">OMDb</strong>.
          </p>
        </div>
      </section>
    </div>
  );
}
