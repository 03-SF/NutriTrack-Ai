// api/index.js
// Single Vercel Serverless Function entrypoint that forwards all `/api/*`
// requests into the backend Express app.
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

  // Requests are rewritten to `/api/index?path=<originalPath>`.
  // Convert that back into the path the Express app expects.
  const incomingUrl = req.url || "/";
  const urlObj = new URL(incomingUrl, "http://localhost");
  const rewrittenPath = urlObj.searchParams.get("path");

  if (rewrittenPath !== null) {
    urlObj.searchParams.delete("path");
    const rest = urlObj.searchParams.toString();
    const clean = String(rewrittenPath).replace(/^\/+/, "");
    const nextPath = clean ? `/api/${clean}` : "/api";
    req.url = rest ? `${nextPath}?${rest}` : nextPath;
  }

  return app(req, res);
}

