import mongoose from "mongoose";

const customMovieSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    poster_path: { type: String, required: true, trim: true },
    overview: { type: String, default: "", trim: true },
    mediaType: { type: String, enum: ["movie", "tv"], default: "movie" },
    isCustom: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const CustomMovie = mongoose.model(
  "customMovies",
  customMovieSchema,
  "customMovies"
);

export default CustomMovie;
