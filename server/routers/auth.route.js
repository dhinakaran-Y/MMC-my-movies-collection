import express from "express";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "#controllers/authControllers";
import { googleLogin } from "#controllers/googleAuthController";
import validateBody from "#middleware/zod-validate";
import { loginSchema, registerSchema } from "#schemas/authSchema";
import { authMiddleware } from "#middleware/auth";

const router = express.Router();

// to create a user
router.post("/register", validateBody(registerSchema), registerUser);

// to login
router.post("/login", validateBody(loginSchema), loginUser);

// get the current user
router.get("/me", authMiddleware, getCurrentUser);

// logout
router.post("/logout", logoutUser);

// google login
router.post("/google-login", googleLogin);

export default router;