import Link from "next/link";

export default function CollectionCard({ collection, onDelete, onEdit }) {
  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit();
  };

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete();
  };
  return (
    <Link
      href={`./collections/${collection._id}`}
      className="group z-0 cursor-pointer relative h-72 rounded-3xl bg-[#25283a] border border-white/5 flex flex-col items-center justify-center transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/40">
      {/* Edit/Delete Buttons */}
      <div className="group absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
        <button
          onClick={handleEditClick}
          className="w-10 h-10 flex justify-center items-center bg-white/10 rounded-full hover:bg-brand/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M5 19h1.425L16.2 9.225L14.775 7.8L5 17.575zm-1 2q-.425 0-.712-.288T3 20v-2.425q0-.4.15-.763t.425-.637L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.437.65T21 6.4q0 .4-.138.763t-.437.662l-12.6 12.6q-.275.275-.638.425t-.762.15zM19 6.4L17.6 5zm-3.525 2.125l-.7-.725L16.2 9.225z"
            />
          </svg>
        </button>
        <button
          onClick={handleDeleteClick}
          className="w-10 h-10 flex justify-center items-center bg-red-500/10 rounded-full hover:bg-red-500/50 text-red-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M7.616 20q-.667 0-1.141-.475T6 18.386V6h-.5q-.213 0-.356-.144T5 5.499t.144-.356T5.5 5H9q0-.31.23-.54t.54-.23h4.46q.31 0 .54.23T15 5h3.5q.213 0 .356.144t.144.357t-.144.356T18.5 6H18v12.385q0 .666-.475 1.14t-1.14.475zM17 6H7v12.385q0 .269.173.442t.443.173h8.769q.269 0 .442-.173t.173-.442zm-6.692 11q.213 0 .357-.144t.143-.356v-8q0-.213-.144-.356T10.307 8t-.356.144t-.143.356v8q0 .213.144.356q.144.144.356.144m3.385 0q.213 0 .356-.144t.143-.356v-8q0-.213-.144-.356Q13.904 8 13.692 8q-.213 0-.357.144t-.143.356v8q0 .213.144.356t.357.144M7 6v13z"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-col items-center">
        <h1 className="text-xl font-semibold text-slate-400 group-hover:text-white capitalize transition-colors duration-300">
          {collection.collectionName}
        </h1>
        <div className="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
        <div className="mt-4 px-3 py-1 rounded-full bg-black/20 text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:border-brand/30 group-hover:text-brand/80 transition-all">
          {collection.moviesList?.length || 0} movies
        </div>
      </div>
    </Link>
  );
}
