import CollectionCard from "@/components/CollectionComponents/CollectionCard";

export const metadata = {
  title: "Collections",
  description: "User's wishlist collections.",
};

export default function CollectionPage() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16 min-h-screen">
      {/* Header*/}
      <div className="mb-12 text-center">
        <h2 className="flex items-center justify-center gap-3 text-4xl font-bold text-white tracking-tight">
          <span className="text-brand">Your Collections</span>
          <svg
            className="text-brand"
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 432 432">
            <path
              fill="currentColor"
              d="M43 88v299h298v42H43q-18 0-30.5-12.5T0 387V88zM384 3q18 0 30.5 12.5T427 45v256q0 18-12.5 30.5T384 344H128q-18 0-30.5-12.5T85 301V45q0-17 12.5-29.5T128 3zM213 269l128-96l-128-96z"
            />
          </svg>
        </h2>
        <p className="text-slate-400 mt-2 font-medium">
          Organize your favorites in one place
        </p>
      </div>

      {/* Grid Layout */}
      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Create New Collection*/}
        <div
          title="Add new collection"
          className="group cursor-pointer h-72 border-2 border-dashed border-slate-700 hover:border-brand/50 rounded-3xl flex flex-col items-center justify-center transition-all duration-300 hover:bg-brand/5">
          <div className="p-4 rounded-full bg-slate-800 group-hover:bg-brand/10 transition-colors">
            <svg
              className="text-slate-400 group-hover:text-brand transition-colors"
              xmlns="http://www.w3.org/2000/svg"
              width="2.5em"
              height="2.5em"
              viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M14 14q1 0 1-1v-2h2q1 0 1-1t-1-1h-2V7q0-1-1-1t-1 1v2h-2q-1 0-1 1t1 1h2v2q0 1 1 1Zm-6 4q-.825 0-1.413-.588T6 16V4q0-.825.588-1.413T8 2h12q.825 0 1.413.588T22 4v12q0 .825-.588 1.413T20 18H8Zm0-2h12V4H8v12Zm-4 6q-.825 0-1.413-.588T2 20V7q0-.425.288-.713T3 6q.425 0 .713.288T4 7v13h13q.425 0 .713.288T18 21q0 .425-.288.713T17 22H4ZM8 4v12V4Z"
              />
            </svg>
          </div>
          <span className="mt-4 text-slate-500 group-hover:text-brand font-semibold uppercase tracking-wider text-xs">
            Create New
          </span>
        </div>

        {/* Watched*/}
        <div className="group relative cursor-pointer h-72 rounded-3xl bg-[#25283a] border border-white/5 flex flex-col items-center justify-center transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/40">
          <h1 className="text-slate-400 group-hover:text-white capitalize font-semibold text-center text-xl transition-colors duration-300">
            Watched
          </h1>
          <div className="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          {/* movies count */}
          {/* <div className="mt-4 px-3 py-1 rounded-full bg-black/20 text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-white/5 group-hover:border-brand/30 group-hover:text-brand/80 transition-all">
        12 movies
      </div> */}
        </div>

        {[1, 1, 1, 1].map((_, index) => (
          <CollectionCard key={index} />
        ))}
      </main>
    </section>
  );
}
