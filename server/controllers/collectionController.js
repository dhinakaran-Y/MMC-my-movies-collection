import Collection from "#models/collection.model";
import mongoose from "mongoose";

// 1.create a new collection

export async function createCollection(req, res) {
  const { ownerId, collectionName, visibility } = req.body;

  try {
    // 1. Check if a collection with this name already exists for this ownerId
    const existing = await Collection.findOne({
      ownerId: ownerId,
      collectionName: collectionName,
    });

    if (existing) {
      return res.status(400).json({
        error: `A collection named '${collectionName}' already exists.`,
      });
    }

    // 2. Prepare the new collection document
    const newCollection = new Collection({
      ownerId: ownerId,
      collectionName: collectionName,
      moviesList: [],
      visibility: visibility || "private",
    });

    // 3. Save the new document
    const savedCollection = await newCollection.save();

    return res.status(201).json({
      message: "Collection created successfully",
      data: savedCollection,
    });
  } catch (error) {
    console.error("Error creating collection:", error);
    return res.status(500).json({ error: "Failed to create collection" });
  }
}

// 2.get all collections of a user
export async function getCollections(req, res) {
  const { ownerId } = req.params;

  try {
    const collections = await Collection.find({ ownerId: ownerId });

    return res.status(200).json({
      success: true,
      collections: collections, // This is now an array of collection documents
    });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return res
      .status(500)
      .json({ error: "Server error while fetching collections." });
  }
}

// 3. get a single collection by its id
export async function getCollectionById(req, res) {
  const { id } = req.params;

  try {
    const collection = await Collection.findById(id);

    if (!collection) {
      return res.status(404).json({ message: "Collection not found." });
    }

    return res.status(200).json({ success: true, data: collection });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return res.status(500).json({ error: "Server error." });
  }
}


// 4. Update a single collection by its ID
export async function updateCollection(req, res) {
  const { id } = req.params;
  const { collectionName, visibility } = req.body;

  try {
    const updatedDoc = await Collection.findByIdAndUpdate(
      id,
      {
        $set: {
          collectionName: collectionName,
          visibility: visibility,
        },
      },
      { returnDocument: 'after' },
    );

    if (!updatedDoc) {
      return res.status(404).json({ message: "Collection not found." });
    }

    return res.status(200).json({
      message: "Updated successfully",
      data: updatedDoc,
    });
  } catch (error) {
    console.error("Error updating collection:", error);
    return res.status(500).json({ error: "Failed to update collection" });
  }
}

// 5. Delete a collection by its id
export async function deleteCollection(req, res) {
  const { id } = req.params;

  try {
    const deletedDoc = await Collection.findByIdAndDelete(id);

    if (!deletedDoc) {
      return res.status(404).json({ message: "Collection not found." });
    }

    return res
      .status(200)
      .json({ message: "Collection deleted successfully." });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return res.status(500).json({ error: "Failed to delete collection" });
  }
}

// 6. get all collection in db
export async function getAllCollections(req, res) {
  try {
    const collection = await Collection.find();

    if (!collection) {
      return res.status(404).json({ message: "Collection not found." });
    }

    return res.status(200).json({ success: true, data: collection });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return res.status(500).json({ error: "Server error." });
  }
}

// --------------------------------------------------

// get Collections
// router.get("/collections", async (req, res) => {
//   try {
//     const collectionOb = await Collections.find();
//     console.log("Data found in DB:", collectionOb);
//     res.json(collectionOb);
//   } catch (error) {
//     console.error("Error fetching Collections:", error);
//     res.status(500).json({ error: "Failed to fetch collection Arr" });
//   }
// });

// get individual collection
// router.get("/collection/:collectionId", async (req, res) => {
//   const param = req.params.collectionId;
//   const email = param.split("-")[0];
//   const id = param.split("-")[1];
//   const collectionId = email + id;
//   console.log("||", email, "||", id, "||", collectionId);

//   // individual's all collection get
//   try {
//     const collection = await Collections.findOne({ email: email });
//     // console.log("collection:", collection)
//     res.json(collection);
//   } catch (error) {
//     console.error("Error fetching Collection:", error);
//     res.status(500).json({ error: "Failed to fetch collection" });
//   }
// });

// ---------------------------------------------------
// try

// {
//   const result = await Collections.aggregate([
//     // 1. Find the parent document
//     { $match: { email: email } },

//     // 2. Flatten the collections array into individual documents
//     { $unwind: "$collections" },

//     // 3. Find the specific collection by ID
//     { $match: { "collections.collection_id": targetCollectionId } },

//     // 5. Promote the collection object to the top level
//     { $replaceRoot: { newRoot: "$collection" } },
//   ]);

//   // result[0] will be your isolated object
// }

// app.get("/:id", (req, res) => {
//   const userId = req.params.id;
//   const user = teams.find((user) => user.id == userId);

//   if (!user) return res.status(404).send(`User ID ${userId} not found`);
//   res.send(user);
// });