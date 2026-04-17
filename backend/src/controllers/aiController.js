import mammoth from "mammoth";
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

const SUPPORTED_RESUME_TYPES = new Map([["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"]]);
const MAX_RESUME_CHARS_FOR_AI = 5400;
const MAX_JOB_DESCRIPTION_CHARS_FOR_AI = 2400;
const RESUME_EXTRACTION_TIMEOUT_MS = 12000;
const RESUME_TEXT_CACHE = new Map();

const getResumeFileKind = (file) => {
  const mimeKind = SUPPORTED_RESUME_TYPES.get(file?.mimetype || "");
  if (mimeKind) return mimeKind;

  const originalName = (file?.originalname || "").toLowerCase();
  if (originalName.endsWith(".docx")) return "docx";
  return "";
};

const getResumeCacheKey = (file) => {
  return `${file?.originalname || "resume"}:${file?.size || 0}`;
};

const tokenizeKeywords = (text = "") =>
  Array.from(
    new Set(
      (text.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) || []).filter(
        (token) => !["with", "from", "that", "this", "have", "your", "about", "into", "using", "were", "them"].includes(token)
      )
    )
  );

const compactWhitespace = (value = "") => value.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
const normalizeExtractedResumeText = (value = "") => {
  const normalizedLines = value
    .replace(/\u0000/g, "")
    .replace(/[•●▪◦]/g, "-")
    .split(/\r?\n/)
    .map((line) => compactWhitespace(line))
    .filter(Boolean);

  const mergedLines = [];

  for (const line of normalizedLines) {
    const previous = mergedLines[mergedLines.length - 1];
    const shouldMergeWithPrevious =
      previous &&
      !/[:.!?]$/.test(previous) &&
      !/^[-A-Z0-9]/.test(line) &&
      previous.length < 140;

    if (shouldMergeWithPrevious) {
      mergedLines[mergedLines.length - 1] = `${previous} ${line}`;
      continue;
    }

    mergedLines.push(line);
  }

  return mergedLines.join("\n").trim();
};
const withTimeout = async (promise, timeoutMs, errorMessage) => {
  let timeoutId;

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const shortenJobDescription = (jobDescription = "") => compactWhitespace(jobDescription).slice(0, MAX_JOB_DESCRIPTION_CHARS_FOR_AI);

const shortenResumeForAi = (resumeText = "", jobDescription = "") => {
  const normalizedResume = compactWhitespace(resumeText);
  if (normalizedResume.length <= MAX_RESUME_CHARS_FOR_AI) {
    return normalizedResume;
  }

  const keywords = tokenizeKeywords(jobDescription);
  const resumeLines = resumeText
    .split(/\r?\n/)
    .map((line) => compactWhitespace(line))
    .filter(Boolean);

  const scoredLines = resumeLines.map((line, index) => {
    const lowered = line.toLowerCase();
    const keywordHits = keywords.reduce((count, keyword) => count + (lowered.includes(keyword) ? 1 : 0), 0);
    const headingBoost = /^[A-Z][A-Za-z\s/&-]{2,30}$/.test(line) ? 2 : 0;
    return {
      line,
      index,
      score: keywordHits + headingBoost,
    };
  });

  const prioritizedLines = scoredLines
    .filter((item) => item.score > 0)
    .sort((a, b) => (b.score - a.score) || (a.index - b.index))
    .map((item) => item.line);

  const orderedUniqueLines = Array.from(new Set([...resumeLines.slice(0, 12), ...prioritizedLines]));
  let shortened = "";

  for (const line of orderedUniqueLines) {
    const next = shortened ? `${shortened}\n${line}` : line;
    if (next.length > MAX_RESUME_CHARS_FOR_AI) break;
    shortened = next;
  }

  return shortened || normalizedResume.slice(0, MAX_RESUME_CHARS_FOR_AI);
};

const buildQuickResumePreview = ({ resumeText = "", jobDescription = "", targetRole = "" }) => {
  const resumeKeywords = tokenizeKeywords(resumeText);
  const jobKeywords = tokenizeKeywords(jobDescription);
  const overlap = jobKeywords.filter((keyword) => resumeKeywords.includes(keyword));
  const missing = jobKeywords.filter((keyword) => !resumeKeywords.includes(keyword));
  const score = jobKeywords.length ? Math.min(100, Math.round((overlap.length / jobKeywords.length) * 100)) : 0;
  const resumeLower = resumeText.toLowerCase();
  const skillTerms = [
    "react",
    "javascript",
    "typescript",
    "python",
    "java",
    "node",
    "sql",
    "aws",
    "docker",
    "git",
    "api",
    "testing",
    "css",
    "html",
  ];
  const matchedSkillTerms = skillTerms.filter(
    (term) => jobDescription.toLowerCase().includes(term) && resumeLower.includes(term)
  );
  const requestedSkillTerms = skillTerms.filter((term) => jobDescription.toLowerCase().includes(term));
  const skillScore = requestedSkillTerms.length
    ? Math.min(100, Math.round((matchedSkillTerms.length / requestedSkillTerms.length) * 100))
    : score;
  const bulletCount = (resumeText.match(/^\s*[-*•]/gm) || []).length;
  const metricSignalCount = (resumeText.match(/\b\d+%|\b\d+\+|\b\d+\s*(years|yrs|months|users|clients|projects|features)\b/gi) || []).length;
  const experienceScore = Math.min(100, bulletCount * 8 + metricSignalCount * 12 + (/\bexperience\b/i.test(resumeText) ? 20 : 0));
  const keywordCoverageScore = score;
  const sectionScores = {
    overall: score,
    skills: skillScore,
    experience: experienceScore,
    keywordCoverage: keywordCoverageScore,
  };

  const quickReply = [
    "Match Score:",
    `${score}/100. Preliminary score based on resume-to-job keyword overlap while full AI review is starting.`,
    "",
    "Section Scores:",
    `- Skills Match: ${sectionScores.skills}/100`,
    `- Experience Signals: ${sectionScores.experience}/100`,
    `- Keyword Coverage: ${sectionScores.keywordCoverage}/100`,
    "",
    "Strong Matches:",
    overlap.length
      ? overlap.slice(0, 5).map((item) => `- Resume appears to align with ${item}.`).join("\n")
      : "- Strong evidence is still being checked in the full review.",
    "",
    "Gaps:",
    missing.length
      ? missing.slice(0, 5).map((item) => `- ${item} is requested in the job description but not clearly visible yet.`).join("\n")
      : "- No major keyword gaps detected in the quick scan.",
    "",
    "Risk Flags:",
    "- This is a quick preview, not the final evidence-based review.",
    "- Final rewrite suggestions and presentation feedback will stream in next.",
    "",
    "Rewrite Suggestions:",
    `- Tailor the summary and top bullets${targetRole ? ` for ${targetRole}` : ""} using the strongest matching keywords.`,
    "- Add measurable results where the resume currently sounds task-focused.",
    "",
    "Verdict:",
    "Starting detailed AI review now.",
  ].join("\n");

  return {
    score,
    sectionScores,
    content: quickReply,
  };
};

const extractResumeTextFromUpload = async (file) => {
  if (!file?.buffer?.length) {
    throw new Error("Resume file is required.");
  }

  const fileKind = getResumeFileKind(file);
  if (!fileKind) {
    throw new Error("Only DOCX resumes are supported.");
  }

  const cacheKey = getResumeCacheKey(file);
  const cachedText = RESUME_TEXT_CACHE.get(cacheKey);
  if (cachedText) {
    return {
      text: cachedText,
      fileKind,
      fromCache: true,
    };
  }

  const parsed = await withTimeout(
    mammoth.extractRawText({ buffer: file.buffer }),
    RESUME_EXTRACTION_TIMEOUT_MS,
    "Resume scan timed out. Please try again with a simpler DOCX file."
  );
  const extractedText = parsed?.value?.trim?.() || "";

  const normalizedText = normalizeExtractedResumeText(extractedText);

  if (normalizedText) {
    RESUME_TEXT_CACHE.set(cacheKey, normalizedText);
    if (RESUME_TEXT_CACHE.size > 20) {
      const oldestKey = RESUME_TEXT_CACHE.keys().next().value;
      RESUME_TEXT_CACHE.delete(oldestKey);
    }
  }

  return {
    text: normalizedText,
    fileKind,
    fromCache: false,
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

const buildResumeReviewMessage = ({ resumeText = "", jobDescription = "", targetRole = "", fileName = "" }) => [
  "Review this resume carefully against the job description.",
  "Use only the provided resume content as evidence.",
  "Focus the feedback on presentation quality, clarity, section structure, weak wording, missing proof, and how the resume can be represented better for the target role.",
  "Do not rewrite the entire resume and do not dump the extracted resume text back to the user.",
  "When suggesting improvements, prefer concise, high-value changes the candidate can apply to the existing resume file.",
  fileName ? `Uploaded resume file: ${fileName}` : "",
  targetRole ? `Target role: ${targetRole.trim()}` : "",
  "",
  "Resume:",
  resumeText.trim(),
  "",
  "Job Description:",
  jobDescription.trim(),
]
  .filter(Boolean)
  .join("\n");

export async function streamResumeCheck(req, res) {
  const abortController = new AbortController();
  let clientDisconnected = false;
  const writeEvent = (event) => {
    if (clientDisconnected) return;
    res.write(`${JSON.stringify(event)}\n`);
  };

  req.on("close", () => {
    clientDisconnected = true;
    abortController.abort();
  });

  try {
    const { jobDescription = "", targetRole = "" } = req.body || {};
    if (!req.file) {
      return res.status(400).json({
        message: "Resume upload is required. Choose a DOCX file from local storage and try again.",
      });
    }

    res.status(200);
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    writeEvent({
      type: "meta",
      provider: "scanning",
      model: req.file?.originalname || "resume-upload",
    });
    writeEvent({
      type: "status",
      stage: "upload_received",
      message: "Resume received. Preparing file scan...",
    });

    writeEvent({
      type: "status",
      stage: "extracting_resume",
      message: `Scanning ${req.file.originalname || "resume"} for readable content... This should be quick for DOCX.`,
    });
    const { text: resumeText, fileKind, fromCache } = await extractResumeTextFromUpload(req.file);

    if (fromCache) {
      writeEvent({
        type: "status",
        stage: "resume_cache_hit",
        message: "Using cached resume scan for this file. Starting analysis faster...",
      });
    }

    if (!resumeText.trim()) {
      return res.status(400).json({ message: "We could not extract readable text from the uploaded resume." });
    }

    if (!jobDescription.trim()) {
      return res.status(400).json({ message: "Job description is required for an accurate comparison." });
    }

    writeEvent({
      type: "status",
      stage: "starting_ai",
      message: "Resume scan complete. Starting Ollama analysis...",
    });

    const quickPreview = buildQuickResumePreview({
      resumeText,
      jobDescription,
      targetRole,
    });
    writeEvent({
      type: "preview",
      score: quickPreview.score,
      sectionScores: quickPreview.sectionScores,
      content: quickPreview.content,
    });

    writeEvent({
      type: "meta",
      provider: ENV.AI_PROVIDER || "ollama",
      model: ENV.OLLAMA_MODEL || "unknown",
    });

    const optimizedResumeText = shortenResumeForAi(resumeText, jobDescription);
    const optimizedJobDescription = shortenJobDescription(jobDescription);

    for await (const event of streamAiReply({
      mode: "resume",
      topic: targetRole,
      messages: [
        {
          role: "user",
          content: buildResumeReviewMessage({
            resumeText: optimizedResumeText,
            jobDescription: optimizedJobDescription,
            targetRole,
            fileName: req.file?.originalname || "",
          }),
        },
      ],
      allowLocalFallback: true,
      signal: abortController.signal,
    })) {
      if (clientDisconnected) return;
      writeEvent(event);
    }

    if (clientDisconnected) return;
    return res.end();
  } catch (error) {
    if (error.name === "AbortError" || clientDisconnected) {
      return;
    }

    console.error("Error in streamResumeCheck controller:", error.message);

    if (!res.headersSent) {
      return res.status(400).json({ message: error.message || "Failed to analyze resume." });
    }

    res.write(`${JSON.stringify({ type: "error", message: error.message || "Failed to analyze resume." })}\n`);
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
