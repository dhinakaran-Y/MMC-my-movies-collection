import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Profile",
  description: "this page shows the users Profile information.",
};

export default function ProfilePage() {
  return (
    <section>
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-15 space-y-4">
        {/* Profile img */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Image
              className="rounded-full p-1 shadow-lg shadow-brand/10"
              src="/profile-img.png"
              alt="Profile Avatar"
              width={140}
              height={140}
              priority
            />
            {/* Simple CSS Edit Circle */}
            <div className="absolute bottom-1 right-1 w-8 h-8 bg-brand rounded-full flex items-center justify-center border-2 border-dark-body2 cursor-pointer hover:scale-110 transition-transform">
              <span className="text-white text-xs">✎</span>
            </div>
          </div>
        </div>
          {/* info */}
        <div className="space-y-2 flex flex-col items-center">
          <h1 className="text-3xl font-bold text-white">Dhinakaran Y</h1>
          <p className="text-white/60 gap-2">
            <span>✉</span> dhinakaran.y.dhina14@gmail.com
          </p>
          <Link
            href="/login"
            className="flex items-center space-x-1 mt-4 cursor-pointer active:scale-90 px-6 py-1.5 border border-brand group text-brand text-sm font-semibold rounded-full hover:bg-brand hover:text-white transition-all duration-300">
            <span>
              <svg
                height="24"
                viewBox="0 0 24 24"
                width="24"
                focusable="false"
                className="fill-brand group-hover:fill-white">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"></path>
                <path d="M0 0h24v24H0z" fill="none"></path>
              </svg>
            </span>
            <span>Sign out</span>
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="w-xs lg:w-sm mx-auto grid grid-cols-2 gap-4">
        {/* Collections */}
        <div className="bg-dark-body2 border border-brand rounded-xl p-6 shadow-md">
          <div className="flex flex-col items-center">
            <span className="text-white/40 text-xs font-bold uppercase tracking-wider">
              📁 Collections
            </span>
            <span className="text-4xl font-mono font-bold text-white mt-1">
              10
            </span>
          </div>
        </div>

        {/* Watched */}
        <div className="bg-dark-body2 border border-blue-500 rounded-xl p-6 shadow-md">
          <div className="flex flex-col items-center">
            <span className="text-white/40 text-xs font-bold uppercase tracking-wider">
              🎬 Watched
            </span>
            <span className="text-4xl font-mono font-bold text-white mt-1">
              08
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
