// One-time migration script: Drop old email_1 unique index
// Run with: node drop-old-email-index.js

import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns/promises";

dns.setServers(["1.1.1.1"]);

const connectionString = process.env.MONGODB_URI || "";

try {
  await mongoose.connect(connectionString, { dbName: "mmc-db" });
  console.log("✅ Connected to MongoDB");

  const db = mongoose.connection.db;
  const collection = db.collection("users");

  // List current indexes
  const indexes = await collection.indexes();
  console.log("\n📋 Current indexes:");
  indexes.forEach((idx) => {
    console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? "(UNIQUE)" : ""}`);
  });

  // Check if old email_1 index exists
  const emailIndex = indexes.find((idx) => idx.name === "email_1");
  if (emailIndex) {
    console.log("\n🔄 Dropping old 'email_1' unique index...");
    await collection.dropIndex("email_1");
    console.log("✅ Dropped 'email_1' index successfully");
  } else {
    console.log("\nℹ️ No 'email_1' index found — nothing to drop");
  }

  // Backfill existing users with authProvider: "local" if not set
  const updateResult = await collection.updateMany(
    { $or: [{ authProvider: { $exists: false } }, { authProvider: null }] },
    { $set: { authProvider: "local" } }
  );
  console.log(`\n🔄 Backfilled ${updateResult.modifiedCount} user(s) with authProvider: "local"`);

  // The new compound index {email, authProvider} will be auto-created by Mongoose
  // when the User model is loaded (via userSchema.index())
  console.log("\n✅ Migration complete! The new compound index will be created automatically by Mongoose on server start.");

} catch (error) {
  console.error("🔴 Migration error:", error);
} finally {
  await mongoose.disconnect();
  process.exit(0);
}
