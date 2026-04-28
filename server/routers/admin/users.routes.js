import express from "express";
import { authMiddleware } from "#middleware/auth";
import { isAdmin } from "#middleware/admin";
import { deleteUser, totalCollections, totalUsers, totalWatchedMovies, updateMyAccount, updateUser, userList } from "#controllers/adminControllers";
import User from "#models/user.model";

const router = express.Router();

// 1. users
router.get("/users", authMiddleware, isAdmin, userList);

// 2. Total Users
router.get("/admin/users-count", authMiddleware, isAdmin, totalUsers);

// 3. Total Watched Movies (Count across all users)
router.get("/admin/watched-movies-count", authMiddleware, isAdmin, totalWatchedMovies);

// 4. Total Collections
router.get("/admin/collections-count", authMiddleware, isAdmin, totalCollections);

// update a user's account
router.put("/admin/users/:id", authMiddleware, isAdmin, updateUser);

// delete a user's account
router.delete("/admin/users/:id", authMiddleware, isAdmin, deleteUser);

// update user account as a user
router.patch("/user/update", authMiddleware, updateMyAccount);

export default router;