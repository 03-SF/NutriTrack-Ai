// api/[...path].js
// Catch-all serverless function for Express API on Vercel.
import mongoose from "mongoose";
import dotenv from "dotenv";

import app from "../backend/src/app.js";

dotenv.config();

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  const { MONGO_URI } = process.env;
  if (!MONGO_URI) {
    throw new Error("Missing MONGO_URI in environment variables");
  }

  await mongoose.connect(MONGO_URI);
  isConnected = true;
  console.log("✅ MongoDB connected");
}

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (e) {
    console.error("❌ MongoDB connection error:", e);
    return res.status(500).json({ error: "Database connection failed" });
  }

  // Some Vercel runtimes strip the `/api` prefix when routing to a function.
  // The backend Express app expects paths like `/api/auth/*`, so normalize.
  const url = req.url || "/";
  if (!url.startsWith("/api/")) {
    req.url = url.startsWith("/") ? `/api${url}` : `/api/${url}`;
  }

  return app(req, res);
}
