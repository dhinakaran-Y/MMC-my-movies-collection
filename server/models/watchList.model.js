import mongoose from "mongoose";

const watchListSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    }, // Indexing this makes "Fetch All" instant
    watchedMoviesList: { type: [String], default: [] },
  },
  { timestamps: true },
);

const WatchList = mongoose.model("watchList", watchListSchema, "watchList");
export default WatchList;