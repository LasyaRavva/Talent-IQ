import { ENV } from "./env.js";

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";
const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_MODEL = "llama3.1:8b";

const resolveGeminiModel = (requestedModel) => {
  const model = (requestedModel || DEFAULT_GEMINI_MODEL).trim();

  // Older examples used 1.5-flash; map it to a currently available flash model.
  if (model === "gemini-1.5-flash") return DEFAULT_GEMINI_MODEL;

  return model;
};

const buildSystemPrompt = (mode, topic, difficulty) => {
  if (mode === "interview") {
    return [
      "You are an interview coach for software engineers.",
      "Run a realistic mock interview.",
      "Ask one interview question at a time and wait for the candidate response.",
      "When the user asks to start an interview, respond with only the first interview question.",
      "After each candidate answer, provide structured feedback with these headings exactly: Communication, Basic Knowledge, Improvements, Next Question.",
      "Under Communication, comment on clarity, structure, and confidence.",
      "Under Basic Knowledge, comment on correctness of concepts, technical depth, and missing fundamentals.",
      "Under Improvements, give short, practical suggestions the candidate can apply immediately.",
      "Under Next Question, ask exactly one new interview question on the same topic and difficulty.",
      "Do not answer like a tutor in interview mode unless the user explicitly asks to stop the interview.",
      "Do not repeat previous wording verbatim.",
      "Keep tone encouraging and practical.",
      topic ? `Focus area: ${topic}.` : "",
      difficulty ? `Interview difficulty: ${difficulty}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    "You are an AI teaching assistant for coding interview preparation.",
    "Coach mode is teaching mode, not interview mode.",
    "Answer the exact user question directly first.",
    "Explain concepts clearly with short examples.",
    "When useful, include step-by-step reasoning and practical coding advice.",
    "If user asks for code, provide concise and correct code snippets.",
    "Do not quiz the user unless they explicitly ask for questions.",
    "Do not repeat previous wording verbatim.",
    topic ? `Prioritize topic: ${topic}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
};

const sanitizeMessages = (messages) => {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((m) => m && typeof m.content === "string")
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content.trim().slice(0, 3000),
    }))
    .filter((m) => m.content.length > 0)
    .slice(-20);
};

const createLineDecoder = () => {
  const decoder = new TextDecoder();
  let buffer = "";

  return {
    push(chunk) {
      buffer += decoder.decode(chunk, { stream: true });
      const parts = buffer.split(/\r?\n/);
      buffer = parts.pop() || "";
      return parts;
    },
    flush() {
      buffer += decoder.decode();
      const remaining = buffer;
      buffer = "";
      return remaining ? [remaining] : [];
    },
  };
};

const extractOpenAiDelta = (data) =>
  data?.choices?.[0]?.delta?.content ??
  data?.choices?.[0]?.message?.content ??
  "";

const extractGeminiText = (data) =>
  data?.candidates
    ?.flatMap((candidate) => candidate?.content?.parts || [])
    ?.map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("") || "";

const extractOllamaDelta = (data) => data?.message?.content || "";

const getLastUserMessage = (messages) => [...messages].reverse().find((m) => m.role === "user")?.content || "";

const getAssistantMessages = (messages) => messages.filter((m) => m.role === "assistant").map((m) => m.content);

const isInterviewKickoff = (lastUserMessage) =>
  /start .*interview|mock interview|ask me the first question|begin interview|first question/i.test(lastUserMessage);

const buildInterviewFeedback = (answer) => {
  const trimmedAnswer = answer.trim();
  const wordCount = trimmedAnswer.split(/\s+/).filter(Boolean).length;
  const mentionsExample = /example|for instance|for example/i.test(trimmedAnswer);
  const mentionsTradeoff = /trade[\s-]?off|time complexity|space complexity|edge case/i.test(trimmedAnswer);

  const communication =
    wordCount < 20
      ? "Your answer is brief. Add a clearer structure: approach, reason, and final takeaway."
      : "Your answer is understandable. A stronger structure with a crisp opening and summary would improve delivery.";

  const basicKnowledge =
    mentionsTradeoff || mentionsExample
      ? "You showed some core understanding. Push further by explaining why your approach is correct and what trade-offs you considered."
      : "Your answer needs more technical depth. Mention the main concept, why it works, and any trade-offs or edge cases.";

  const improvements = [
    "Start with a one-line summary of your approach.",
    mentionsExample ? "Keep the example short and tie it back to the concept." : "Use one small example to make your explanation concrete.",
    "Mention at least one edge case or trade-off before you finish.",
  ];

  return [
    "Communication:",
    communication,
    "",
    "Basic Knowledge:",
    basicKnowledge,
    "",
    "Improvements:",
    improvements.map((item, index) => `${index + 1}. ${item}`).join("\n"),
  ].join("\n");
};

const buildNextInterviewQuestion = (topic, difficulty) => {
  const focus = topic || "data structures and algorithms";
  const level = difficulty || "medium";
  return `Next Question:\nFor a ${level} interview in ${focus}, explain how you would solve a typical problem, justify your approach, and mention one edge case you would test.`;
};

const callLocalCoach = ({ messages, mode, topic, difficulty }) => {
  const lastUserMessage = getLastUserMessage(messages);
  const assistantMessages = getAssistantMessages(messages);
  const header =
    mode === "interview"
      ? "I am in local interview mode (no external AI key configured)."
      : "I am in local coach mode (no external AI key configured).";

  const guidance =
    mode === "interview"
      ? (() => {
          if (!lastUserMessage || isInterviewKickoff(lastUserMessage) || assistantMessages.length <= 1) {
            return [
              "Interview Question:",
              `For a ${difficulty || "medium"} level ${topic || "software engineering"} interview, tell me how you would approach a problem in this area, what trade-offs you would consider, and how you would test your solution.`,
            ].join("\n");
          }

          return [buildInterviewFeedback(lastUserMessage), "", buildNextInterviewQuestion(topic, difficulty)].join("\n");
        })()
      : (() => {
          if (!lastUserMessage) {
            return [
              "Quick learning guidance:",
              topic ? `Topic: ${topic}` : "Topic: general interview preparation",
              difficulty ? `Difficulty: ${difficulty}` : "Difficulty: mixed",
              "Ask a specific coding question and I will answer it directly.",
            ].join("\n");
          }

          return [
            "Direct Answer:",
            `Here is a concise explanation for your question about "${lastUserMessage}".`,
            "",
            "Explanation:",
            "Break the problem into inputs, constraints, and expected output first.",
            "Start with the simplest correct approach, then improve time and space complexity.",
            mentionsAlgorithm(lastUserMessage)
              ? "For algorithm questions, explain the data structure choice, complexity, and edge cases."
              : "For concept questions, define the idea clearly, explain why it matters, and give one practical example.",
            "",
            "Next Step:",
            "If you want, ask for code, an example, or a mock follow-up question.",
          ].join("\n");
        })();

  return {
    reply: `${header}\n\n${guidance}`,
    model: "local-fallback",
    provider: "local",
  };
};

function mentionsAlgorithm(text) {
  return /array|string|tree|graph|dp|dynamic programming|algorithm|binary|stack|queue|linked list|hash/i.test(text);
}

const normalizeText = (value) => value.toLowerCase().replace(/\s+/g, " ").trim();

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

const hasUsableOpenAiKey = () => hasUsableValue(ENV.OPENAI_API_KEY);
const hasUsableGeminiKey = () => hasUsableValue(ENV.GEMINI_API_KEY);
const hasOllamaConfigured = () => hasUsableValue(ENV.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL) && hasUsableValue(ENV.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL);
const hasExternalAiConfigured = () => Boolean(hasUsableGeminiKey() || hasUsableOpenAiKey() || hasOllamaConfigured());
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isQuotaError = (message = "") => /quota|rate limit|billing details|free_tier_requests|free_tier_input_token_count/i.test(message);

const streamLocalReplyChunks = async function* ({ reply, provider, model }) {
  const chunks = reply.match(/.{1,24}(\s|$)|\S+/g) || [reply];

  for (const chunk of chunks) {
    await sleep(70);
    yield { type: "delta", content: chunk, provider, model };
  }
};

const makeReplyNonRepeating = (reply, messages, mode) => {
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")?.content;

  if (!lastAssistant) return reply;

  if (normalizeText(lastAssistant) !== normalizeText(reply)) return reply;

  const suffix =
    mode === "interview"
      ? "\n\nFollow-up: explain your trade-offs and mention one edge case you would test."
      : "\n\nAlternative view: try solving it with a concrete example, then optimize for time and space.";

  return `${reply}${suffix}`;
};

const callOpenAI = async ({ messages, systemPrompt, signal }) => {
  const apiKey = ENV.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const baseUrl = (ENV.OPENAI_BASE_URL || DEFAULT_OPENAI_BASE_URL).replace(/\/$/, "");
  const model = ENV.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;

  const payload = {
    model,
    temperature: 0.7,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
  };

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal,
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenAI request failed");
  }

  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("OpenAI returned an empty response");

  return { reply, model, provider: "openai" };
};

const streamOpenAI = async function* ({ messages, systemPrompt, signal }) {
  const apiKey = ENV.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const baseUrl = (ENV.OPENAI_BASE_URL || DEFAULT_OPENAI_BASE_URL).replace(/\/$/, "");
  const model = ENV.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;

  const payload = {
    model,
    temperature: 0.7,
    stream: true,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
  };

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal,
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    let message = "OpenAI stream request failed";
    try {
      const data = await response.json();
      message = data?.error?.message || message;
    } catch {}
    throw new Error(message);
  }

  yield { type: "meta", provider: "openai", model };

  const lineDecoder = createLineDecoder();
  let assembled = "";

  for await (const chunk of response.body) {
    const lines = lineDecoder.push(chunk);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;

      const dataText = line.slice(5).trim();
      if (!dataText) continue;
      if (dataText === "[DONE]") {
        yield { type: "done", reply: assembled, provider: "openai", model };
        return;
      }

      let data;
      try {
        data = JSON.parse(dataText);
      } catch {
        continue;
      }

      const delta = extractOpenAiDelta(data);
      if (!delta) continue;

      assembled += delta;
      yield { type: "delta", content: delta, provider: "openai", model };
    }
  }

  for (const rawLine of lineDecoder.flush()) {
    const line = rawLine.trim();
    if (!line.startsWith("data:")) continue;

    const dataText = line.slice(5).trim();
    if (!dataText || dataText === "[DONE]") continue;

    try {
      const data = JSON.parse(dataText);
      const delta = extractOpenAiDelta(data);
      if (!delta) continue;
      assembled += delta;
      yield { type: "delta", content: delta, provider: "openai", model };
    } catch {}
  }

  yield { type: "done", reply: assembled, provider: "openai", model };
};

const toGeminiContents = (messages) => {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
};

const callGemini = async ({ messages, systemPrompt, signal }) => {
  const apiKey = ENV.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const model = resolveGeminiModel(ENV.GEMINI_MODEL);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: toGeminiContents(messages),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 700,
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Gemini request failed");
  }

  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!reply) throw new Error("Gemini returned an empty response");

  return { reply, model, provider: "gemini" };
};

const callOllama = async ({ messages, systemPrompt, signal }) => {
  const baseUrl = (ENV.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL).replace(/\/$/, "");
  const model = ENV.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      model,
      stream: false,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(data?.error || "Ollama request failed");
  }

  const reply = data?.message?.content?.trim();
  if (!reply) throw new Error("Ollama returned an empty response");

  return { reply, model, provider: "ollama" };
};

const streamGemini = async function* ({ messages, systemPrompt, signal }) {
  const apiKey = ENV.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const model = resolveGeminiModel(ENV.GEMINI_MODEL);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const payload = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: toGeminiContents(messages),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 700,
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    let message = "Gemini stream request failed";
    try {
      const data = await response.json();
      message = data?.error?.message || message;
    } catch {}
    throw new Error(message);
  }

  yield { type: "meta", provider: "gemini", model };

  const lineDecoder = createLineDecoder();
  let assembled = "";

  for await (const chunk of response.body) {
    const lines = lineDecoder.push(chunk);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;

      const dataText = line.slice(5).trim();
      if (!dataText) continue;

      let data;
      try {
        data = JSON.parse(dataText);
      } catch {
        continue;
      }

      const text = extractGeminiText(data);
      if (!text) continue;

      const delta = text.startsWith(assembled) ? text.slice(assembled.length) : text;
      if (!delta) continue;

      assembled += delta;
      yield { type: "delta", content: delta, provider: "gemini", model };
    }
  }

  for (const rawLine of lineDecoder.flush()) {
    const line = rawLine.trim();
    if (!line.startsWith("data:")) continue;

    const dataText = line.slice(5).trim();
    if (!dataText) continue;

    try {
      const data = JSON.parse(dataText);
      const text = extractGeminiText(data);
      if (!text) continue;
      const delta = text.startsWith(assembled) ? text.slice(assembled.length) : text;
      if (!delta) continue;
      assembled += delta;
      yield { type: "delta", content: delta, provider: "gemini", model };
    } catch {}
  }

  if (!assembled) {
    throw new Error("Gemini returned an empty response");
  }

  yield { type: "done", reply: assembled, provider: "gemini", model };
};

const streamOllama = async function* ({ messages, systemPrompt, signal }) {
  const baseUrl = (ENV.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL).replace(/\/$/, "");
  const model = ENV.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });

  if (!response.ok || !response.body) {
    let message = "Ollama stream request failed";
    try {
      const data = await response.json();
      message = data?.error || message;
    } catch {}
    throw new Error(message);
  }

  yield { type: "meta", provider: "ollama", model };

  const lineDecoder = createLineDecoder();
  let assembled = "";

  for await (const chunk of response.body) {
    const lines = lineDecoder.push(chunk);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      let data;
      try {
        data = JSON.parse(line);
      } catch {
        continue;
      }

      const delta = extractOllamaDelta(data);
      if (delta) {
        assembled += delta;
        yield { type: "delta", content: delta, provider: "ollama", model };
      }

      if (data?.done) {
        yield { type: "done", reply: assembled, provider: "ollama", model };
        return;
      }
    }
  }

  for (const rawLine of lineDecoder.flush()) {
    const line = rawLine.trim();
    if (!line) continue;

    try {
      const data = JSON.parse(line);
      const delta = extractOllamaDelta(data);
      if (delta) {
        assembled += delta;
        yield { type: "delta", content: delta, provider: "ollama", model };
      }
    } catch {}
  }

  if (!assembled) throw new Error("Ollama returned an empty response");
  yield { type: "done", reply: assembled, provider: "ollama", model };
};

export const generateAiReply = async ({ mode, topic, difficulty, messages, allowLocalFallback = false, signal }) => {
  const safeMessages = sanitizeMessages(messages);
  if (!safeMessages.length) throw new Error("At least one user message is required");

  const normalizedMode = mode === "interview" ? "interview" : "coach";
  const systemPrompt = buildSystemPrompt(normalizedMode, topic, difficulty);
  const preferredProvider = (ENV.AI_PROVIDER || (hasOllamaConfigured() ? "ollama" : "gemini")).toLowerCase();
  const externalAiConfigured = hasExternalAiConfigured();
  const cloudProviderConfigured = hasUsableGeminiKey() || hasUsableOpenAiKey();

  if (preferredProvider === "local" || !externalAiConfigured) {
    const local = callLocalCoach({ messages: safeMessages, mode: normalizedMode, topic, difficulty });
    return {
      ...local,
      reply: makeReplyNonRepeating(local.reply, safeMessages, normalizedMode),
    };
  }

  const attempts =
    preferredProvider === "ollama"
      ? ["ollama", "gemini", "openai"]
      : preferredProvider === "openai"
        ? ["openai", "gemini", "ollama"]
        : ["gemini", "openai", "ollama"];
  const errors = [];

  for (const provider of attempts) {
    try {
      if (provider === "ollama" && hasOllamaConfigured()) {
        const result = await callOllama({ messages: safeMessages, systemPrompt, signal });
        return {
          ...result,
          reply: makeReplyNonRepeating(result.reply, safeMessages, normalizedMode),
        };
      }

      if (provider === "gemini" && hasUsableGeminiKey()) {
        const result = await callGemini({ messages: safeMessages, systemPrompt, signal });
        return {
          ...result,
          reply: makeReplyNonRepeating(result.reply, safeMessages, normalizedMode),
        };
      }

      if (provider === "openai" && hasUsableOpenAiKey()) {
        const result = await callOpenAI({ messages: safeMessages, systemPrompt, signal });
        return {
          ...result,
          reply: makeReplyNonRepeating(result.reply, safeMessages, normalizedMode),
        };
      }
    } catch (error) {
      if (error.name === "AbortError") {
        throw error;
      }

      errors.push(`${provider}: ${error.message}`);
      if (!allowLocalFallback || !isQuotaError(error.message)) {
        console.warn(`${provider} provider failed:`, error.message);
      }
    }
  }

  if (!cloudProviderConfigured) {
    const local = callLocalCoach({ messages: safeMessages, mode: normalizedMode, topic, difficulty });
    return {
      ...local,
      reply: makeReplyNonRepeating(local.reply, safeMessages, normalizedMode),
      warnings: errors,
    };
  }

  if (externalAiConfigured) {
    if (allowLocalFallback) {
      const local = callLocalCoach({ messages: safeMessages, mode: normalizedMode, topic, difficulty });
      return {
        ...local,
        reply: makeReplyNonRepeating(local.reply, safeMessages, normalizedMode),
        warnings: errors,
      };
    }

    throw new Error(
      errors.length
        ? `External AI request failed. ${errors.join(" | ")}` 
        : "External AI request failed. No working provider is available."
    );
  }

  const local = callLocalCoach({ messages: safeMessages, mode: normalizedMode, topic, difficulty });
  return {
    ...local,
    reply: makeReplyNonRepeating(local.reply, safeMessages, normalizedMode),
  };
};

export const streamAiReply = async function* ({ mode, topic, difficulty, messages, allowLocalFallback = false, signal }) {
  const safeMessages = sanitizeMessages(messages);
  if (!safeMessages.length) throw new Error("At least one user message is required");

  const normalizedMode = mode === "interview" ? "interview" : "coach";
  const systemPrompt = buildSystemPrompt(normalizedMode, topic, difficulty);
  const preferredProvider = (ENV.AI_PROVIDER || (hasOllamaConfigured() ? "ollama" : "gemini")).toLowerCase();
  const externalAiConfigured = hasExternalAiConfigured();
  const cloudProviderConfigured = hasUsableGeminiKey() || hasUsableOpenAiKey();

  if (preferredProvider === "local" || !externalAiConfigured) {
    const local = callLocalCoach({ messages: safeMessages, mode: normalizedMode, topic, difficulty });
    const reply = makeReplyNonRepeating(local.reply, safeMessages, normalizedMode);
    yield { type: "meta", provider: local.provider, model: local.model };
    for await (const event of streamLocalReplyChunks(reply ? { reply, provider: local.provider, model: local.model } : { reply: "", provider: local.provider, model: local.model })) {
      yield event;
    }
    yield { type: "done", reply, provider: local.provider, model: local.model };
    return;
  }

  const attempts =
    preferredProvider === "ollama"
      ? ["ollama", "gemini", "openai"]
      : preferredProvider === "openai"
        ? ["openai", "gemini", "ollama"]
        : ["gemini", "openai", "ollama"];
  const errors = [];

  for (const provider of attempts) {
    try {
      const streamer =
        provider === "ollama" && hasOllamaConfigured()
          ? streamOllama
          : provider === "gemini" && hasUsableGeminiKey()
          ? streamGemini
          : provider === "openai" && hasUsableOpenAiKey()
            ? streamOpenAI
            : null;

      if (!streamer) continue;

      let finalReply = "";
      for await (const event of streamer({ messages: safeMessages, systemPrompt, signal })) {
        if (event.type === "done") {
          finalReply = event.reply || finalReply;
          const reply = makeReplyNonRepeating(finalReply, safeMessages, normalizedMode);

          if (reply !== finalReply) {
            yield {
              type: "delta",
              content: reply.slice(finalReply.length),
              provider: event.provider,
              model: event.model,
            };
          }

          yield { ...event, reply };
        } else {
          if (event.type === "delta") finalReply += event.content;
          yield event;
        }
      }

      return;
    } catch (error) {
      if (error.name === "AbortError") {
        throw error;
      }

      errors.push(`${provider}: ${error.message}`);
      if (!allowLocalFallback || !isQuotaError(error.message)) {
        console.warn(`${provider} stream provider failed:`, error.message);
      }
    }
  }

  if (!cloudProviderConfigured) {
    const local = callLocalCoach({ messages: safeMessages, mode: normalizedMode, topic, difficulty });
    const reply = makeReplyNonRepeating(local.reply, safeMessages, normalizedMode);
    yield { type: "meta", provider: local.provider, model: local.model };
    for await (const event of streamLocalReplyChunks({ reply, provider: local.provider, model: local.model })) {
      yield event;
    }
    yield {
      type: "done",
      reply,
      provider: local.provider,
      model: local.model,
      warnings: errors,
    };
    return;
  }

  if (externalAiConfigured) {
    if (allowLocalFallback) {
      const local = callLocalCoach({ messages: safeMessages, mode: normalizedMode, topic, difficulty });
      const reply = makeReplyNonRepeating(local.reply, safeMessages, normalizedMode);
      yield { type: "meta", provider: local.provider, model: local.model };
      for await (const event of streamLocalReplyChunks({ reply, provider: local.provider, model: local.model })) {
        yield event;
      }
      yield {
        type: "done",
        reply,
        provider: local.provider,
        model: local.model,
        warnings: errors,
      };
      return;
    }

    throw new Error(
      errors.length
        ? `External AI stream failed. ${errors.join(" | ")}`
        : "External AI stream failed. No working provider is available."
    );
  }

  const local = callLocalCoach({ messages: safeMessages, mode: normalizedMode, topic, difficulty });
  const reply = makeReplyNonRepeating(local.reply, safeMessages, normalizedMode);
  yield { type: "meta", provider: local.provider, model: local.model };
  for await (const event of streamLocalReplyChunks({ reply, provider: local.provider, model: local.model })) {
    yield event;
  }
  yield {
    type: "done",
    reply,
    provider: local.provider,
    model: local.model,
    warnings: errors,
  };
};
