import User from "#models/user.model";
import bcrypt from "bcrypt";
import Collection from "#models/collection.model";
import WatchList from "#models/watchList.model";

export async function userList(req, res) {
  try {
    const userArr = await User.find({}, { password: 0 });
    res.json(userArr);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch userList" });
  }
}

export async function totalUsers(req, res) {
  try {
    const [count, googleCount, localCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ authProvider: "google" }),
      User.countDocuments({
        $or: [
          { authProvider: "local" },
          { authProvider: { $exists: false } },
          { authProvider: null },
        ],
      }),
    ]);
    res.json({ count, googleCount, localCount });
  } catch (error) {
    console.error("Error fetching total users:", error);
    res.status(500).json({ error: "Failed to fetch user count" });
  }
}

export async function totalWatchedMovies(req, res) {
  try {
    const result = await WatchList.aggregate([
      { $unwind: "$watchedMoviesList" }, 
      { $count: "total" }, 
    ]);

    res.json({ count: result[0]?.total || 0 });
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate watched movies" });
  }
}

export async function totalCollections(req, res) {
  try {  
    const count = await Collection.countDocuments({});
  
    return res.status(200).json({ count });
  } catch (error) {
    return res.status(500).json({ 
      message: "Server Error", 
      error: error.message 
    });
  }
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const { name, email, role, password, language, profileImage } = req.body;

  try {
    const updateData = { name, email, role };
    if (language !== undefined) {
      updateData.language = language;
    }
    if (profileImage !== undefined) {
      updateData.profileImage = profileImage;
    }
    // Only update password if provided
    if (password) {
      updateData.password = bcrypt.hashSync(password, 10);
    }
    
    await User.findByIdAndUpdate(id, updateData);
    res.json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    // 1. Delete the User
    await User.findByIdAndDelete(id);
    // 2. Cleanup associated data
    await WatchList.findOneAndDelete({ ownerId: id });
    await Collection.deleteMany({ ownerId: id });
    
    res.json({ message: "User and data deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
}

// Update account as a user
export async function updateMyAccount(req, res) {
  const { id } = req.user; // Get user ID from middleware
  
  const { name, email, password, language, profileImage, region, watchOption } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();

    // Google accounts cannot modify email or password
    if (user.authProvider !== "google") {
      if (email && email.trim().toLowerCase() !== user.email) {
        const normalizedEmail = email.trim().toLowerCase();
        const conflict = await User.findOne({
          _id: { $ne: id },
          email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
          $or: [
            { authProvider: "local" },
            { authProvider: { $exists: false } },
            { authProvider: null },
          ],
        });
        if (conflict) {
          return res.status(400).json({ error: "An account with this email already exists." });
        }
        updateData.email = normalizedEmail;
      }

      // Only hash and update password if it's provided
      if (password && password.trim() !== "") {
        updateData.password = bcrypt.hashSync(password, 10);
      }
    }

    if (language !== undefined) {
      updateData.language = language;
    }
    if (region !== undefined) {
      updateData.region = region;
    }
    if (watchOption !== undefined) {
      updateData.watchOption = watchOption;
    }
    if (profileImage !== undefined) {
      updateData.profileImage = profileImage;
    }
    
    await User.findByIdAndUpdate(id, updateData);
    res.json({ message: "Profile updated" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
}