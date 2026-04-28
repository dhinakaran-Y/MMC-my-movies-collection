import CollectionMovieCard from "@/components/CollectionComponents/CollectionMovieCard";

export default async function SingleCollectionPageGrid({moviesList, collectionId}) {
    return (
      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {moviesList.map((movie) => (
          <CollectionMovieCard key={movie.id} movie={movie} collectionId={collectionId}/>
        ))}
      </main>
    );
}