import User from "#models/user.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { json } from "zod";
import { ObjectId } from "mongodb";
import Collection from "#models/collection.model";
import WatchList from "#models/watchList.model";

const isProd = process.env.NODE_ENV === "production";

// register
export async function registerUser(req, res) {
  const { name, email, password } = req.validateBody;
  try {
    const user = new User({
      name,
      email,
      password: bcrypt.hashSync(password, 10),
    });

    const createdUser = await user.save();

    const watchList = new WatchList({
      ownerId: createdUser._id,
      watchedMoviesList: [],
    });

    await watchList.save();
    res.send({
      message: `✅User ${name} registered successfully with email ${email}😊...`,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
}

// login
export async function loginUser(req, res) {
  const { email, password } = req.validateBody;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // i have that user info
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    // res.cookie("token", token, {
    //   httpOnly: true,
    //   maxAge: 60 * 60 * 1000,
    //   sameSite: "Lax",
    //   path: "/",
    // });

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
      sameSite: isProd ? "None" : "Lax", // "None" for cross-origin in prod
      secure: isProd, // required when sameSite is "None"
      path: "/",
    });

    res.json({ message: `User ${user.name} logged in successfully`, token });
  } catch (error) {
    console.error("Error logging in user:", error);
    res
      .status(500)
      .json({ error: "Failed to login user", errorMessage: error.message });
  }
}

// get current user in me end point
export async function getCurrentUser(req, res) {
  const loggedInUser = req.user;

  if (loggedInUser.role === "admin") {
    console.log("Admin user logged in:", loggedInUser);
  } else {
    console.log("Regular user logged in:", loggedInUser);
  }

  console.log("logged in user from /me endpoint:", loggedInUser);

  try {
    const user = await User.findOne({ _id: loggedInUser.id }, { password: 0 });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

// logout
export function logoutUser(req, res) {
  // res.clearCookie("token", {
  //   httpOnly: true,
  //   sameSite: "Lax",
  //   path: "/",
  // });

  res.clearCookie("token", {
    httpOnly: true,
    sameSite: isProd ? "None" : "Lax",
    secure: isProd,
    path: "/",
  });

  res.json({ message: "Logged out successfully" });
}
