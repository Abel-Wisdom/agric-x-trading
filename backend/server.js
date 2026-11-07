import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./src/routes/authRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import researchRoutes from "./src/routes/researchRoutes.js";
import articleRoutes from "./src/routes/articleRoutes.js";
import videoRoutes from "./src/routes/videoRoutes.js";
import serviceRoutes from "./src/routes/serviceRoutes.js";
import mediaRoutes from "./src/routes/mediaRoutes.js";
import messageRoutes from "./src/routes/messageRoutes.js";
import settingsRoutes from "./src/routes/settingsRoutes.js";

const app = express();

// Read allowed frontend origins from the backend environment.
// Multiple origins can be separated with commas.
const allowedOrigins = (
  process.env.FRONTEND_URL || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// MIDDLEWARE
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

// HEALTH CHECK
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Agric X Trading API is running.",
  });
});

// API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/research", researchRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/settings", settingsRoutes);

// START SERVER
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Agric X Trading API running on port ${PORT}`);
});