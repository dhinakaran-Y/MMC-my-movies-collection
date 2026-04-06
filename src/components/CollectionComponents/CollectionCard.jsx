import Link from "next/link"

export default function CollectionCard() {
  return (
    <Link href={"./collections/singleCollection"}>
      <div className="group relative cursor-pointer h-72 rounded-3xl bg-[#25283a] border border-white/5 flex flex-col items-center justify-center transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/40">
        <h1 className="text-slate-400 group-hover:text-white capitalize font-semibold text-center text-xl transition-colors duration-300">
          Collection Name
        </h1>
        <div className="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        {/* movies count */}
        {/* <div className="mt-4 px-3 py-1 rounded-full bg-black/20 text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-white/5 group-hover:border-brand/30 group-hover:text-brand/80 transition-all">
        12 movies
      </div> */}
      </div>
    </Link>
  );
}
