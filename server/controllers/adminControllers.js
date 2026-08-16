import User from "#models/user.model";
import bcrypt from "bcrypt";
import Collection from "#models/collection.model";
import WatchList from "#models/watchList.model";

export async function userList(req, res) {
  try {
    const userArr = await User.find();
    res.json(userArr);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch userList" });
  }
}

export async function totalUsers(req, res) {
  const count = await User.countDocuments();
  res.json({ count });
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
  
  const { name, email, password, language, profileImage } = req.body;

  try {
    const updateData = { name, email };
    if (language !== undefined) {
      updateData.language = language;
    }
    if (profileImage !== undefined) {
      updateData.profileImage = profileImage;
    }
    // Only hash and update password if it's provided
    if (password && password.trim() !== "") {
      updateData.password = bcrypt.hashSync(password, 10);
    }
    
    await User.findByIdAndUpdate(id, updateData);
    res.json({ message: "Profile updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
}