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
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } });
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
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
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password. Please check your password and try again." });
    }

    // i have that user info
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" },
    );

    // Cookie settings: secure for production (HTTPS), insecure for development (HTTP)
    const cookieOptions = {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    };

    // For production on HTTPS
    if (isProd) {
      cookieOptions.sameSite = "None";
      cookieOptions.secure = true;
      console.log("✅ [LOGIN] Production mode: sameSite=None, secure=true");
    } else {
      // For development on localhost (HTTP)
      cookieOptions.sameSite = "Lax";
      cookieOptions.secure = false;
      console.log("✅ [LOGIN] Development mode: sameSite=Lax, secure=false");
    }

    res.cookie("token", token, cookieOptions);
    console.log("✅ [LOGIN] Cookie set with options:", cookieOptions);
    console.log("✅ [LOGIN] Token payload:", {
      id: user._id,
      email: user.email,
      role: user.role,
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
    sameSite: "None",
    secure: true,
    path: "/",
  });

  res.json({ message: "Logged out successfully" });
}
