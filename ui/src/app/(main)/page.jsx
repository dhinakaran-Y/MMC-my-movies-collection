import AsideFilter from "@/components/AsideFilter";
import CollectionCreateForm from "@/components/CollectionComponents/CollectionCreateForm";
import HomeGrid from "@/components/HomeGrid";
import MovieCard from "@/components/MovieCard";
import Pagination from "@/components/Pagination";
import LanguageRegionMappedData from "@/data/LanguageRegionMappedData.json";

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

/* getMovies Fn
 * 1. search query
 * 2. genre filtering
 * 3. language
 * 4. top rated
 */
async function getMovies(
  page = 1,
  topRated = false,
  lang = "",
  query = "",
  genre = "",
) {
  const today = new Date().toISOString().split("T")[0];
  let url = "";

  // 1.Search
  if (query) {
    url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
  }

  // 2. discover - Filter
  else {
    url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&page=${page}`;

    // genre
    if (genre) {
      url += `&with_genres=${genre}`;
    }

    // language & region
    if (lang) {
      const regionObj = LanguageRegionMappedData.find(
        (l) => l.language === lang,
      );
      const region = regionObj?.region || "IN";
      url += `&with_original_language=${lang}&region=${region}`;
    }

    // top rated
    if (topRated) {
      // global top rated filter
      // the vote counts must 500 above is considered...
      const minVotes = lang ? 50 : 500;
      url += `&sort_by=vote_average.desc&vote_count.gte=${minVotes}`;
    } else {
      // regional
      url += `&release_date.lte=${today}&with_release_type=3|4&sort_by=release_date.desc`;
    }
  }

  // console.log("URL:", url);

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return { results: [], total_pages: 0 };
    return res.json();
  } catch (error) {
    console.error("Fetch Error:", error);
    return { results: [], total_pages: 0 };
  }
}

async function getLanguages() {
  const res = await fetch(
    `${BASE_URL}/configuration/languages?api_key=${API_KEY}`,
    {
      next: { revalidate: 86400 },
    },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.sort((a, b) => a.english_name.localeCompare(b.english_name));
}

async function getGenres() {
  const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.genres || [];
}

export default async function Home({ searchParams }) {
  // Await searchParams for Next.js 15+
  const params = await searchParams;

  const currentPage = Number(params.page) || 1;
  const isTopRated = params.topRated === "true";
  const language = params.lang || "";
  const query = params.query || "";
  const genre = params.genre || "";

  // Fetch all secondary data and main movie data in parallel
  const [movieData, languagesArr, genresArr] = await Promise.all([
    getMovies(currentPage, isTopRated, language, query, genre),
    getLanguages(),
    getGenres(),
  ]);

  const movieArr = movieData.results || [];
  const apiLimit = 500;
  const actualTotalPages = movieData.total_pages || 1;
  const displayTotalPages = Math.min(actualTotalPages, apiLimit);

  // console.log(movieArr);

  return (
    <div className="h-screen grid grid-cols-12 gap-3 bg-dark-body1 overflow-hidden">
      {/* Sidebar - Pass query, lang, and genres to manage UI states */}
      <AsideFilter
        // languagesArr={languagesArr}
        genresArr={genresArr}
        currentLang={language}
        currentGenre={genre}
        currentQuery={query}
      />

      {/* <main className="col-span-9 h-full overflow-y-auto p-8 custom-scrollbar">
        {movieArr.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {movieArr.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          // no data found
          <div className="h-[60vh] flex flex-col items-center justify-center text-white/40">
            <p className="text-xl font-semibold tracking-tight">
              No movies found matching your current filters.
            </p>
          </div>
        )}

        {movieArr.length > 0 && (
          <div className="mt-12 mb-8">
            <Pagination
              currentPage={currentPage}
              totalPages={displayTotalPages}
            />
          </div>
        )}
      </main> */}

      <HomeGrid
        movieArr={movieArr}
        currentPage={currentPage}
        displayTotalPages={displayTotalPages}
      />
      
      {/* <CollectionCreateForm
              isOpen={isOpen}
              onClose={() => {
                setIsOpen(false);
                setEditingData(null);
              }}
              onSubmit={handleCollectionSubmit}
              initialData={editingData}
            /> */}
    </div>
  );
}
