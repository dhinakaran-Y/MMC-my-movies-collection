import WatchListMovieCard from "@/components/CollectionComponents/WatchListMovieCard";

export default function WatchListCollectionGrid({moviesList}) {
    return (
      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {moviesList.map((movie) => { 
         return <WatchListMovieCard key={movie.id} movie={movie} />}
        )}
      </main>
    );
}