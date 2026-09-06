import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    password: { type: String, default: null },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    language: { type: String, default: "" },
    region: { type: String, default: "IN" },
    watchOption: { type: String, enum: ["flatrate", "buy", "rent", "free", "ads"], default: "flatrate" },
    profileImage: { type: String, default: "" },
    googleProfileImage: { type: String, default: "" },
  },
  { timestamps: true },
);

// Compound unique index: same email can exist for different authProviders
userSchema.index({ email: 1, authProvider: 1 }, { unique: true });

// Google users must have unique googleId (only indexed when googleId is a string)
userSchema.index(
  { googleId: 1 },
  { unique: true, partialFilterExpression: { googleId: { $type: "string" } } },
);

const User = mongoose.model("users", userSchema);

export default User;