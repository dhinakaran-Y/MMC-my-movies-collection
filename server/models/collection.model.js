import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    }, // Indexing this makes "Fetch All" instant
    collectionName: { type: String, required: true },
    moviesList: {type:[String], default: [] },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
    // shareToken: { type: String, default: () => crypto.randomUUID() }, // Optional: For unique links
  },
  { timestamps: true },
);

const Collection = mongoose.model(
  "usersCollections",
  collectionSchema,
  "usersCollections",
);
export default Collection;