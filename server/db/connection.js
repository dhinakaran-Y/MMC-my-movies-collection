import { MongoClient } from "mongodb";
import mongoose from "mongoose";
import dns from "node:dns/promises";

dns.setServers(["1.1.1.1"]);

// const client = new MongoClient(connectionString);

const connectionString = process.env.MONGODB_URI || "";

try {
  await mongoose.connect(connectionString, {dbName: "mmc-db"})
  console.log("connected to mongoose");
} catch (e) {
  console.error(e);
  console.error("Failed to connect to MongoDB", connectionString);
}