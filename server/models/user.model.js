import mongoose from "mongoose";
import { type } from "node:os";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    // role: {type: String, required: true}
  },
  { timestamps: true },
);

const User = mongoose.model("users", userSchema);

export default User;