import Collection from "#models/collection.model";
import WatchList from "#models/watchList.model";
import mongoose from "mongoose";

// collection
//------------
// 1.add movie
export async function addMovieToCollection(req, res) {
  const { collectionId, movieId } = req.body;

  try {
    const updated = await Collection.findByIdAndUpdate(
      collectionId,
      { $addToSet: { moviesList: movieId } }, // $addToSet prevents duplicates
      { returnDocument: "after" },
    );

    if (!updated)
      return res.status(404).json({ message: "Collection not found" });

    return res.status(200).json({ message: "Movie added!", data: updated });
  } catch (error) {
    return res.status(500).json({ error: "Failed to add movie" });
  }
}

// 2.remove movie
export async function removeMovieFromCollection(req, res) {
  const { collectionId, movieId } = req.body;

  try {
    const updated = await Collection.findByIdAndUpdate(
      collectionId,
      { $pull: { moviesList: movieId } },
      { returnDocument: "after" },
    );

    if (!updated)
      return res.status(404).json({ message: "Collection not found" });

    return res.status(200).json({ message: "Movie removed!", data: updated });
  } catch (error) {
    return res.status(500).json({ error: "Failed to remove movie" });
  }
}

// watchList
//------------
// 1.add movie as watched
export async function addMovieToWatched(req, res) {
  const { ownerId, movieId } = req.body;

  try {
    const updated = await WatchList.findOneAndUpdate(
      { ownerId: ownerId },
      { $addToSet: { watchedMoviesList: movieId } }, // $addToSet prevents duplicates
      { returnDocument: "after" },
    );

    if (!updated)
      return res
        .status(404)
        .json({ message: "WatchList not found for this user." });

    return res
      .status(200)
      .json({ message: "Movie added to watched list!", data: updated });
  } catch (error) {
    return res.status(500).json({ error: "Failed to add movie as watched" });
  }
}

// 2.remove movie from watched
export async function removeMovieFromWatched(req, res) {
  const { ownerId, movieId } = req.body;

  try {
    const updated = await WatchList.findOneAndUpdate(
      { ownerId: ownerId },
      { $pull: { watchedMoviesList: movieId } },
      { returnDocument: "after" },
    );

    if (!updated)
      return res
        .status(404)
        .json({ message: "WatchList not found for this user." });

    return res
      .status(200)
      .json({ message: "Movie removed from watched list!", data: updated });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to remove movie from watchList!" });
  }
}

// get all movies in watchList by user id
export async function getWatchList(req, res) {
  const { userId } = req.params;

  try {
    const list = await WatchList.findOne({ ownerId: userId });

    if (!list) {
      return res.status(200).json({
        success: true,
        movies: [],
      });
    }

    return res.status(200).json({
      success: true,
      movies: list.watchedMoviesList || [],
    });
  } catch (error) {
    console.error("Error fetching WatchList:", error);
    return res.status(500).json({
      error: "Server error while fetching WatchList.",
    });
  }
}

// get all movies in watchList in db
export async function getAllWatchList(req, res) {
  try {
    const list = await WatchList.find();

    if (!list) {
      return res.status(200).json({
        success: true,
        movies: [],
      });
    }

    return res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("Error fetching WatchList:", error);
    return res.status(500).json({
      error: "Server error while fetching WatchList.",
    });
  }
}