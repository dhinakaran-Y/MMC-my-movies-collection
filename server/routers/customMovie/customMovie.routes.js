import express from "express";
import {
  createCustomMovie,
  getCustomMovie,
  updateCustomMovie,
  deleteCustomMovie,
} from "#controllers/customMovieController";
import { authMiddleware } from "#middleware/auth";

const router = express.Router();

// Create custom movie
router.post("/custom-movie", authMiddleware, createCustomMovie);

// Get single custom movie details
router.get("/custom-movie/:id", getCustomMovie);

// Update custom movie
router.patch("/custom-movie/:id", authMiddleware, updateCustomMovie);
router.put("/custom-movie/:id", authMiddleware, updateCustomMovie);

// Delete custom movie
router.delete("/custom-movie/:id", authMiddleware, deleteCustomMovie);

export default router;
