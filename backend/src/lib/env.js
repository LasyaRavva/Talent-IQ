import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFileCandidates = [
  path.resolve(__dirname, "../../../.env"),
  path.resolve(__dirname, "../../.env"),
];

for (const envPath of envFileCandidates) {
  if (!fs.existsSync(envPath)) continue;

  dotenv.config({
    path: envPath,
    quiet: true,
  });
}

export const ENV = {
  PORT: process.env.PORT,
  DB_URL: process.env.DB_URL,
  NODE_ENV: process.env.NODE_ENV,
  CLIENT_URL: process.env.CLIENT_URL,
  INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
  INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
  STREAM_API_KEY: process.env.STREAM_API_KEY,
  STREAM_API_SECRET: process.env.STREAM_API_SECRET,
  AI_PROVIDER: process.env.AI_PROVIDER,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
  OLLAMA_MODEL: process.env.OLLAMA_MODEL,
  SIMLI_API_KEY: process.env.SIMLI_API_KEY,
  SIMLI_FACE_ID: process.env.SIMLI_FACE_ID,
  SIMLI_MAX_SESSION_LENGTH: process.env.SIMLI_MAX_SESSION_LENGTH,
  SIMLI_MAX_IDLE_TIME: process.env.SIMLI_MAX_IDLE_TIME,
};
