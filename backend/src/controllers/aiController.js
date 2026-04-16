import { generateAiReply, streamAiReply } from "../lib/aiClient.js";
import { ENV } from "../lib/env.js";

const PLACEHOLDER_ENV_PATTERNS = [
  /^your[_-]/i,
  /your .* api key/i,
  /^placeholder$/i,
  /^changeme$/i,
];

const hasUsableValue = (value) => {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_ENV_PATTERNS.some((pattern) => pattern.test(trimmed));
};

const isOpenAiQuotaError = (message = "") =>
  /quota|billing details|insufficient_quota|exceeded your current quota/i.test(message);

const decodeBase64Audio = (audioBase64 = "") => {
  const match = audioBase64.match(/^data:(.+?);base64,(.+)$/);
  if (match) {
    return {
      mimeType: match[1],
      buffer: Buffer.from(match[2], "base64"),
    };
  }

  return {
    mimeType: "audio/webm",
    buffer: Buffer.from(audioBase64, "base64"),
  };
};

export async function askAiCoach(req, res) {
  try {
    const { messages, mode = "coach", topic = "", difficulty = "", allowLocalFallback = false } = req.body;

    const result = await generateAiReply({
      mode,
      topic,
      difficulty,
      messages,
      allowLocalFallback,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (!allowLocalFallback) {
      console.error("Error in askAiCoach controller:", error.message);
    }
    return res.status(400).json({ message: error.message || "Failed to get AI response" });
  }
}

export async function streamAiCoach(req, res) {
  const { allowLocalFallback = false } = req.body || {};
  const abortController = new AbortController();
  let clientDisconnected = false;

  req.on("close", () => {
    clientDisconnected = true;
    abortController.abort();
  });

  try {
    const { messages, mode = "coach", topic = "", difficulty = "" } = req.body;

    res.status(200);
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    for await (const event of streamAiReply({
      mode,
      topic,
      difficulty,
      messages,
      allowLocalFallback,
      signal: abortController.signal,
    })) {
      if (clientDisconnected) return;
      res.write(`${JSON.stringify(event)}\n`);
    }

    if (clientDisconnected) return;
    return res.end();
  } catch (error) {
    if (error.name === "AbortError" || clientDisconnected) {
      return;
    }

    if (!allowLocalFallback) {
      console.error("Error in streamAiCoach controller:", error.message);
    }

    if (!res.headersSent) {
      return res.status(400).json({ message: error.message || "Failed to stream AI response" });
    }

    res.write(`${JSON.stringify({ type: "error", message: error.message || "Failed to stream AI response" })}\n`);
    return res.end();
  }
}

export async function transcribeAudio(req, res) {
  try {
    if (!hasUsableValue(ENV.OPENAI_API_KEY)) {
      return res.status(400).json({
        message:
          "Voice transcription fallback is not configured. Ollama can power chat replies, but recorded voice transcription currently needs a real OPENAI_API_KEY.",
      });
    }

    const { audioBase64, mimeType: requestedMimeType = "audio/webm" } = req.body || {};
    if (!audioBase64 || typeof audioBase64 !== "string") {
      return res.status(400).json({ message: "Audio input is required for transcription." });
    }

    const { mimeType, buffer } = decodeBase64Audio(audioBase64);
    if (!buffer?.length) {
      return res.status(400).json({ message: "Audio input could not be decoded." });
    }

    const extension = (() => {
      if ((mimeType || requestedMimeType).includes("mp4")) return "mp4";
      if ((mimeType || requestedMimeType).includes("mpeg")) return "mpeg";
      if ((mimeType || requestedMimeType).includes("mp3")) return "mp3";
      if ((mimeType || requestedMimeType).includes("wav")) return "wav";
      if ((mimeType || requestedMimeType).includes("ogg")) return "ogg";
      return "webm";
    })();

    const baseUrl = (ENV.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const formData = new FormData();
    const audioFile = new File([buffer], `speech.${extension}`, {
      type: mimeType || requestedMimeType,
    });

    formData.append("file", audioFile);
    formData.append("model", "whisper-1");
    formData.append("response_format", "json");

    const response = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const providerMessage = data?.error?.message || "Failed to transcribe audio.";
      if (isOpenAiQuotaError(providerMessage)) {
        return res.status(400).json({
          message:
            "OpenAI transcription quota is unavailable for this key. AI chat can still use Ollama or Gemini, but recorded voice transcription needs a funded OPENAI_API_KEY.",
        });
      }

      return res.status(400).json({
        message: providerMessage,
      });
    }

    return res.status(200).json({
      text: data?.text?.trim?.() || "",
      provider: "openai",
      model: "whisper-1",
    });
  } catch (error) {
    console.error("Error in transcribeAudio controller:", error.message);
    return res.status(500).json({ message: error.message || "Failed to transcribe audio." });
  }
}

export async function createSimliAvatarSession(req, res) {
  try {
    if (!ENV.SIMLI_API_KEY || !ENV.SIMLI_FACE_ID) {
      return res.status(400).json({
        message: "Simli avatar is not configured. Add SIMLI_API_KEY and SIMLI_FACE_ID in backend/.env.",
      });
    }

    const response = await fetch("https://api.simli.ai/compose/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-simli-api-key": ENV.SIMLI_API_KEY,
      },
      body: JSON.stringify({
        faceId: ENV.SIMLI_FACE_ID,
        apiVersion: "v2",
        handleSilence: true,
        maxSessionLength: Number(ENV.SIMLI_MAX_SESSION_LENGTH || 1800),
        maxIdleTime: Number(ENV.SIMLI_MAX_IDLE_TIME || 300),
        audioInputFormat: "pcm16",
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data?.session_token) {
      return res.status(400).json({
        message: data?.detail?.[0]?.msg || data?.message || data?.error || "Failed to create Simli avatar session",
      });
    }

    return res.status(200).json({
      sessionToken: data.session_token,
      faceId: ENV.SIMLI_FACE_ID,
      transportMode: "livekit",
    });
  } catch (error) {
    console.error("Error in createSimliAvatarSession controller:", error.message);
    return res.status(500).json({ message: error.message || "Failed to create Simli avatar session" });
  }
}
