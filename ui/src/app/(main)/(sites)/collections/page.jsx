import CollectionGrid from "./CollectionGrid";

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
      <CollectionGrid/>
    </section>
  );
}
