import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");
const hasFrontendBuild = fs.existsSync(frontendIndexPath);
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

app.get("/api", (req, res) => {
  res.status(200).json({
    msg: "Talent IQ backend is running",
    frontendUrl: ENV.CLIENT_URL,
    apiBaseUrl: "/api",
    healthcheck: "/health",
    frontendBuildPresent: hasFrontendBuild,
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ msg: "api is up and running" });
});

// Serve the built frontend whenever it exists, regardless of host env quirks.
if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));

  app.get("/", (req, res) => {
    res.sendFile(frontendIndexPath);
  });

  app.get("/{*any}", (req, res) => {
    if (req.path.startsWith("/api") || req.path === "/health") {
      return res.status(404).json({ msg: "Not Found" });
    }

    res.sendFile(frontendIndexPath);
  });
}

const startServer = async () => {
  try {
    await connectDB();
    const port = ENV.PORT || 3000;
    app.listen(port, () => console.log("Server is running on port:", port));
  } catch (error) {
    console.error("💥 Error starting the server", error);
  }
};

startServer();
