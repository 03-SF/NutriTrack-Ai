// api/index.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../backend/src/app.js";
import { startNutritionArchiver } from "../backend/src/nutritionArchiver.js";

dotenv.config();

// MongoDB connection
let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return;
  }

  const { MONGO_URI } = process.env;
  if (!MONGO_URI) {
    throw new Error("Missing MONGO_URI in environment variables");
  }

  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    console.log("✅ MongoDB connected");
    
    // Start nutrition archiver
    try {
      startNutritionArchiver();
    } catch (e) {
      console.log("⚠️  Nutrition archiver warning:", e.message);
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

// Ensure DB is connected before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

export default app;

