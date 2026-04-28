import express from "express";
import { authMiddleware } from "#middleware/auth";
import { createCollection, deleteCollection, getAllCollections, getCollectionById, getCollections, updateCollection } from "#controllers/collectionController";

const router = express.Router();

// add collection
router.post("/collection", authMiddleware ,createCollection);
// get all
router.get("/get-collections/:ownerId", authMiddleware, getCollections);
// get single collection
router.get("/collection/:id", getCollectionById);
// update
router.patch("/collection/:id", authMiddleware, updateCollection);
// delete
router.delete("/collection/:id", authMiddleware, deleteCollection);
// get all collections in db
router.get("/all-collections", getAllCollections);

export default router;