import "dotenv/config";
import express from "express";
import authRouter from "#routers/auth.route";
import mongoose from "mongoose";
import User from "#models/user.model";
import "#db/connection";
import { json } from "node:stream/consumers";
import adminRoutes from "#routers/admin/users.routes";
import collectionRoutes from "#routers/collections/collections.routes";
import moviesRoutes from "#routers/movies/movies.routes";
import customMovieRoutes from "#routers/customMovie/customMovie.routes";
import cloneRequestRoutes from "#routers/cloneRequest/cloneRequest.routes";

const router = express.Router();

// console.log("running index route");

router.get("/", async (req, res) => {
  res.send("server running..");
});

router.use(authRouter);

// get users list
router.use(adminRoutes);

// collection routes
router.use(collectionRoutes);

// movies routes
router.use(moviesRoutes);

// custom movies routes
router.use(customMovieRoutes);

// clone request routes
router.use(cloneRequestRoutes);

// router.get("/ss", async (req, res) => {
//   try {
//     const userArr = await User.find();
//     res.json(userArr);
//   } catch (error) {
//     console.error("Error fetching user:", error);
//     res.status(500).json({ error: "Failed to fetch user" });
//   }
// });

export default router;
