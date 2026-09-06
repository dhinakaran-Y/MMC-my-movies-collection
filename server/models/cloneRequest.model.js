import mongoose from "mongoose";

const cloneRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    giverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "shared", "completed", "rejected"],
      default: "pending",
    },
    sharingMode: {
      type: String,
      enum: ["all", "public", "private", "custom"],
      default: null,
    },
    // Collections the giver chose to share (populated on accept)
    sharedCollectionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "usersCollections",
      },
    ],
    // Collections the requester chose to clone (populated on confirm)
    selectedCollections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "usersCollections",
      },
    ],
    clonedCount: {
      type: Number,
      default: 0,
    },
    message: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

// Prevent duplicate pending requests from same requester to same giver
cloneRequestSchema.index(
  { requesterId: 1, giverId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  },
);

const CloneRequest = mongoose.model("cloneRequests", cloneRequestSchema, "cloneRequests");
export default CloneRequest;
