import axiosInstance, { getAuthRequestHeaders } from "../lib/axios";

const normalizeBaseUrl = (value) => {
  if (!value) return "";

  const trimmedValue = value.trim().replace(/\/+$/, "");
  if (!trimmedValue) return "";

  return trimmedValue.endsWith("/api") ? trimmedValue.slice(0, -4) : trimmedValue;
};

const buildApiUrl = (path) => {
  const explicitBase = normalizeBaseUrl(import.meta.env.VITE_API_URL);
  const originBase = typeof window !== "undefined" ? window.location.origin : "";
  const base = explicitBase || originBase;
  return `${base}${path}`;
};

export const aiApi = {
  askCoach: async ({ messages, mode, topic, difficulty, allowLocalFallback = false }) => {
    const response = await axiosInstance.post("/api/ai/coach", {
      messages,
      mode,
      topic,
      difficulty,
      allowLocalFallback,
    });

    return response.data;
  },
  askCoachStream: async ({ messages, mode, topic, difficulty, allowLocalFallback = false, onEvent, signal }) => {
    const headers = await getAuthRequestHeaders();
    const response = await fetch(buildApiUrl("/api/ai/coach/stream"), {
      method: "POST",
      credentials: "include",
      signal,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        messages,
        mode,
        topic,
        difficulty,
        allowLocalFallback,
      }),
    });

    if (!response.ok || !response.body) {
      let message = "Failed to stream AI response";
      try {
        const data = await response.json();
        message = data?.message || message;
      } catch (error) {
        console.warn("Unable to read AI stream error payload:", error);
      }
      throw new Error(message);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const event = JSON.parse(trimmed);
          onEvent?.(event);

          if (event.type === "error") {
            throw new Error(event.message || "Failed to stream AI response");
          }
        }

        if (done) break;
      }

      if (buffer.trim()) {
        const event = JSON.parse(buffer.trim());
        onEvent?.(event);
        if (event.type === "error") {
          throw new Error(event.message || "Failed to stream AI response");
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
  askResumeCheckStream: async ({ resumeFile, jobDescription, targetRole, onEvent, signal }) => {
    const headers = await getAuthRequestHeaders();
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDescription", jobDescription);
    formData.append("targetRole", targetRole || "");

    const response = await fetch(buildApiUrl("/api/ai/resume-check/stream"), {
      method: "POST",
      credentials: "include",
      signal,
      headers: {
        ...headers,
      },
      body: formData,
    });

    if (!response.ok || !response.body) {
      let message = "Failed to analyze resume";
      try {
        const data = await response.json();
        message = data?.message || message;
      } catch (error) {
        console.warn("Unable to read resume stream error payload:", error);
      }
      throw new Error(message);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const event = JSON.parse(trimmed);
          onEvent?.(event);

          if (event.type === "error") {
            throw new Error(event.message || "Failed to analyze resume");
          }
        }

        if (done) break;
      }

      if (buffer.trim()) {
        const event = JSON.parse(buffer.trim());
        onEvent?.(event);
        if (event.type === "error") {
          throw new Error(event.message || "Failed to analyze resume");
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
  createAvatarSession: async () => {
    const response = await axiosInstance.post("/api/ai/avatar/session");
    return response.data;
  },
  transcribeAudio: async ({ audioBase64, mimeType }) => {
    const response = await axiosInstance.post("/api/ai/transcribe", {
      audioBase64,
      mimeType,
    });

    return response.data;
  },
};
