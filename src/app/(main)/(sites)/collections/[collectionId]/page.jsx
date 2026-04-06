// export const metadata = {
//   title: "Collection",
//   description: "Singe movies collection page",
// };

import CollectionMovieCard from "@/components/CollectionComponents/CollectionMovieCard";

export async function generateMetadata({ params }) {
  const { collectionId } = await params;
  //   console.log(collectionId);
  return {
    title: `${collectionId} | MovieCollection`,
    description: "Singe movies collection page",
  };
}

const movieArr = [
  {
    adult: false,
    backdrop_path: "/1x9e0qWonw634NhIsRdvnneeqvN.jpg",
    genre_ids: [10749, 18],
    id: 1523145,
    original_language: "ru",
    original_title: "Твоё сердце будет разбито",
    overview:
      "High school student Polina is saved from bullying at her new school and makes a deal with the main bully Bars: he must pretend to be her boyfriend and protect her, and she must do everything he says. During this game, the couple develops real feelings, but her family and classmates have reasons to separate the lovers.",
    popularity: 1318.7141,
    poster_path: "/7wIBfBl2gejt6xHxNSK0reVIm7E.jpg",
    release_date: "2026-03-26",
    title: "Your Heart Will Be Broken",
    video: false,
    vote_average: 6.955,
    vote_count: 33,
  },
  {
    adult: false,
    backdrop_path: "/uNToXatdunyvWXyXMrTI1nLvh6r.jpg",
    genre_ids: [35, 878, 80],
    id: 1115544,
    original_language: "en",
    original_title: "Mike & Nick & Nick & Alice",
    overview:
      "Two gangsters and the woman they love try to survive the most dangerous night of their lives. As if that wasn’t enough, there’s one wild ingredient added to the mix: a time machine.",
    popularity: 363.9071,
    poster_path: "/7F0jc75HrSkLVcvOXR2FXAIwuEv.jpg",
    release_date: "2026-03-14",
    title: "Mike & Nick & Nick & Alice",
    video: false,
    vote_average: 6.777,
    vote_count: 141,
  },
  {
    adult: false,
    backdrop_path: "/kKF4gEiBDArhONlCcunHVgBp3bA.jpg",
    genre_ids: [80, 53],
    id: 1171145,
    original_language: "en",
    original_title: "Crime 101",
    overview:
      "When an elusive thief whose high-stakes heists unfold along the iconic 101 freeway in Los Angeles eyes the score of a lifetime, with hopes of this being his final job, his path collides with a disillusioned insurance broker who is facing her own crossroads. Determined to crack the case, a relentless detective closes in on the operation, raising the stakes even higher.",
    popularity: 344.8161,
    poster_path: "/tVvpFIoteRHNnoZMhdnwIVwJpCA.jpg",
    release_date: "2026-02-11",
    title: "Crime 101",
    video: false,
    vote_average: 6.964,
    vote_count: 365,
  },
  {
    adult: false,
    backdrop_path: "/tq3h43fZy0H80vzf47MAY7R9Mxo.jpg",
    genre_ids: [16, 35, 10751],
    id: 1297842,
    original_language: "en",
    original_title: "GOAT",
    overview:
      "A small goat with big dreams gets a once-in-a-lifetime shot to join the pros and play roarball, a high-intensity, co-ed, full-contact sport dominated by the fastest, fiercest animals in the world.",
    popularity: 288.6351,
    poster_path: "/wfuqMlaExcoYiUEvKfVpUTt1v4u.jpg",
    release_date: "2026-02-11",
    title: "GOAT",
    video: false,
    vote_average: 7.8,
    vote_count: 295,
  },
  {
    adult: false,
    backdrop_path: "/z3bzhmC0CPikWeerUkLO73YvGrC.jpg",
    genre_ids: [28, 53, 10402, 27],
    id: 1084187,
    original_language: "en",
    original_title: "Pretty Lethal",
    overview:
      "A troupe of ballerinas find themselves fighting for survival as they attempt to escape from a remote inn after their bus breaks down on the way to a dance competition.",
    popularity: 268.3482,
    poster_path: "/znTPnXCK3lEQJgqXCvP7e5FUz6f.jpg",
    release_date: "2026-03-13",
    title: "Pretty Lethal",
    video: false,
    vote_average: 6.889,
    vote_count: 193,
  },
  {
    adult: false,
    backdrop_path: "/u53UYu5XG2hNgWGvs3xGhAVzypl.jpg",
    genre_ids: [16, 10751, 878, 35, 12],
    id: 1327819,
    original_language: "en",
    original_title: "Hoppers",
    overview:
      "Scientists have discovered how to 'hop' human consciousness into lifelike robotic animals, allowing people to communicate with animals as animals. Animal lover Mabel seizes an opportunity to use the technology, uncovering mysteries within the animal world beyond anything she could have imagined.",
    popularity: 261.82,
    poster_path: "/xjtWQ2CL1mpmMNwuU5HeS4Iuwuu.jpg",
    release_date: "2026-03-04",
    title: "Hoppers",
    video: false,
    vote_average: 7.578,
    vote_count: 373,
  },
];

export default async function SingleCollectionPage({ params }) {
  const { collectionId } = await params;
  // console.log(collectionId);

  // console.log(movieArr);

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 min-h-screen">
      {/* Header*/}
      <div className="mb-12 text-center">
        <h2 className="flex items-center justify-center gap-3 text-4xl font-bold text-white tracking-tight">
          <span className="text-brand">
            {collectionId} - <span className="font-medium opacity-70"> Collection </span>
          </span>
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
          add your favorite movies here...
        </p>
      </div>
      {/* grid */}
      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {movieArr.map((movie) => (
          <CollectionMovieCard key={movie.id} movie={movie} />
        ))}
      </main>
    </section>
  );
}
