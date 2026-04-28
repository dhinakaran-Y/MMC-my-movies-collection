import {
  addMovieToCollection,
  addMovieToWatched,
  getAllWatchList,
  getWatchList,
  removeMovieFromCollection,
  removeMovieFromWatched,
} from "#controllers/moviesControllers";
import express from "express";
import { authMiddleware } from "#middleware/auth";

const router = express.Router();

// collection
//------------
// add movie
router.patch("/add-movie", authMiddleware, addMovieToCollection);
// remove movie
router.patch("/remove-movie", authMiddleware, removeMovieFromCollection);

// watched
// -----------
// add movie
router.patch("/add-watched", authMiddleware, addMovieToWatched);
// remove movie
router.patch("/remove-watched", authMiddleware, removeMovieFromWatched);
// get watchList
router.get("/watch-list/:userId", authMiddleware, getWatchList);
// get all watchList in db
router.get("/all-watchList", authMiddleware, getAllWatchList);

export default router;