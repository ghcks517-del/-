import express from "express";
import cors from "cors";
import apiRoutes from "./routes/api.js";

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
}, apiRoutes);

export default app;
