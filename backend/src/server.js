import express from "express";
import path from "path";
import cors from "cors";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";

import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import { inngest, functions } from "./lib/inngest.js";

import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoute.js";
import aiRoutes from "./routes/aiRoutes.js";
import codeRoutes from "./routes/codeRoutes.js";

const app = express();

const __dirname = path.resolve();
const devOriginRegex = /^http:\/\/localhost:\d+$/;
const allowedOrigins = [ENV.CLIENT_URL, "http://localhost:5173", "http://localhost:5174"];

// middleware
app.use(express.json({ limit: "50mb" }));
// credentials:true meaning?? => server allows a browser to include cookies on request
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isAllowedDevOrigin = ENV.NODE_ENV !== "production" && devOriginRegex.test(origin);
      if (allowedOrigins.includes(origin) || isAllowedDevOrigin) return callback(null, true);

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(clerkMiddleware()); // this adds auth field to request object: req.auth()

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/chat", chatRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/code", codeRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    msg: "Talent IQ backend is running",
    frontendUrl: ENV.CLIENT_URL,
    apiBaseUrl: "/api",
    healthcheck: "/health",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ msg: "api is up and running" });
});

// make our app ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

const startServer = async () => {
  try {
    await connectDB();
    app.listen(ENV.PORT, () => console.log("Server is running on port:", ENV.PORT));
  } catch (error) {
    console.error("💥 Error starting the server", error);
  }
};

startServer();
