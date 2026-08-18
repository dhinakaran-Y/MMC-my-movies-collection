import CustomMovie from "#models/customMovie.model";
import Collection from "#models/collection.model";
import WatchList from "#models/watchList.model";

// 1. Create a custom movie
export async function createCustomMovie(req, res) {
  const { title, poster_path, overview, mediaType, collectionId, addToWatchList } = req.body;
  const ownerId = req.user?.id || req.user?._id || req.body.ownerId;

  if (!ownerId) {
    return res.status(401).json({ error: "User authentication required." });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Movie title is required." });
  }

  if (!poster_path || !poster_path.trim()) {
    return res.status(400).json({ error: "Image URL is required." });
  }

  try {
    const customMovie = await CustomMovie.create({
      ownerId,
      title: title.trim(),
      poster_path: poster_path.trim(),
      overview: (overview || "").trim(),
      mediaType: mediaType === "tv" ? "tv" : "movie",
      isCustom: true,
    });

    const customId = `custom:${customMovie._id}`;

    // If collectionId is provided, automatically link to collection
    if (collectionId) {
      await Collection.findByIdAndUpdate(
        collectionId,
        { $addToSet: { moviesList: customId } },
        { returnDocument: "after" }
      );
    }

    // If addToWatchList is requested, automatically link to watchList
    if (addToWatchList) {
      await WatchList.findOneAndUpdate(
        { ownerId },
        { $addToSet: { watchedMoviesList: customId } },
        { upsert: true, returnDocument: "after" }
      );
    }

    return res.status(201).json({
      success: true,
      message: "Custom movie created successfully!",
      data: customMovie,
      customId,
    });
  } catch (error) {
    console.error("Error creating custom movie:", error);
    return res.status(500).json({ error: "Failed to create custom movie." });
  }
}

// 2. Get single custom movie by ID
export async function getCustomMovie(req, res) {
  const { id } = req.params;
  const cleanId = id.startsWith("custom:") ? id.replace(/^custom:/, "") : id;

  try {
    const movie = await CustomMovie.findById(cleanId);
    if (!movie) {
      return res.status(404).json({ error: "Custom movie not found." });
    }

    return res.status(200).json({
      success: true,
      data: movie,
    });
  } catch (error) {
    console.error("Error fetching custom movie:", error);
    return res.status(500).json({ error: "Failed to fetch custom movie." });
  }
}

// 3. Update custom movie
export async function updateCustomMovie(req, res) {
  const { id } = req.params;
  const cleanId = id.startsWith("custom:") ? id.replace(/^custom:/, "") : id;
  const { title, poster_path, overview, mediaType } = req.body;
  const ownerId = req.user?.id || req.user?._id;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Movie title is required." });
  }

  if (!poster_path || !poster_path.trim()) {
    return res.status(400).json({ error: "Image URL is required." });
  }

  try {
    const movie = await CustomMovie.findById(cleanId);
    if (!movie) {
      return res.status(404).json({ error: "Custom movie not found." });
    }

    if (ownerId && movie.ownerId.toString() !== ownerId.toString()) {
      return res.status(403).json({ error: "Unauthorized to edit this movie." });
    }

    movie.title = title.trim();
    movie.poster_path = poster_path.trim();
    movie.overview = (overview || "").trim();
    if (mediaType) movie.mediaType = mediaType === "tv" ? "tv" : "movie";

    await movie.save();

    return res.status(200).json({
      success: true,
      message: "Custom movie updated successfully!",
      data: movie,
    });
  } catch (error) {
    console.error("Error updating custom movie:", error);
    return res.status(500).json({ error: "Failed to update custom movie." });
  }
}

// 4. Delete custom movie
export async function deleteCustomMovie(req, res) {
  const { id } = req.params;
  const cleanId = id.startsWith("custom:") ? id.replace(/^custom:/, "") : id;
  const ownerId = req.user?.id || req.user?._id;

  try {
    const movie = await CustomMovie.findById(cleanId);
    if (!movie) {
      return res.status(404).json({ error: "Custom movie not found." });
    }

    if (ownerId && movie.ownerId.toString() !== ownerId.toString()) {
      return res.status(403).json({ error: "Unauthorized to delete this movie." });
    }

    await CustomMovie.findByIdAndDelete(cleanId);

    // Also remove from any collection or watchlist referencing this custom ID
    const customId = `custom:${cleanId}`;
    await Promise.all([
      Collection.updateMany(
        { moviesList: customId },
        { $pull: { moviesList: customId } }
      ),
      WatchList.updateMany(
        { watchedMoviesList: customId },
        { $pull: { watchedMoviesList: customId } }
      ),
    ]);

    return res.status(200).json({
      success: true,
      message: "Custom movie deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting custom movie:", error);
    return res.status(500).json({ error: "Failed to delete custom movie." });
  }
}
