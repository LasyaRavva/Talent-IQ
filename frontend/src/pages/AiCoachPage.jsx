import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  BotIcon,
  BrainCircuitIcon,
  Loader2Icon,
  MessageSquareIcon,
  MicIcon,
  MicOffIcon,
  SendIcon,
  SparklesIcon,
  VideoIcon,
  XIcon,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { aiApi } from "../api/ai";
import SimliAvatarTile from "../components/SimliAvatarTile";
import useSpeechInput from "../hooks/useSpeechInput";

const coachIntroMessage =
  "Hi, I am your AI coach. Ask any coding or interview-prep question and I will answer it directly with a clear explanation.";

const interviewIntroMessage =
  "Interview mode is active. I will ask one question at a time, wait for your answer, and then give feedback on communication, basic knowledge, and improvements.";

const appreciationMessages = [
  "Strong answer. You sounded clear and interview-ready.",
  "Nice work. That response showed solid understanding and structure.",
  "Well done. You covered the core idea with confidence.",
];

const getInterviewCelebration = (reply, userAnswer) => {
  const normalizedReply = reply.toLowerCase();
  const normalizedAnswer = userAnswer.trim();

  if (!normalizedAnswer || normalizedAnswer.split(/\s+/).filter(Boolean).length < 12) return null;

  const positiveSignals = [
    "showed some core understanding",
    "your answer is understandable",
    "stronger structure",
    "clearer structure",
    "good",
    "strong",
    "correct",
    "well explained",
  ];

  const negativeSignals = [
    "needs more technical depth",
    "your answer is brief",
    "missing fundamentals",
    "incorrect",
  ];

  const hasPositiveSignal = positiveSignals.some((signal) => normalizedReply.includes(signal));
  const hasNegativeSignal = negativeSignals.some((signal) => normalizedReply.includes(signal));

  if (!hasPositiveSignal || hasNegativeSignal) return null;

  return appreciationMessages[normalizedAnswer.length % appreciationMessages.length];
};

function AiCoachPage() {
  const [mode, setMode] = useState("coach");
  const [topic, setTopic] = useState("Data Structures and Algorithms");
  const [difficulty, setDifficulty] = useState("medium");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ role: "assistant", content: coachIntroMessage }]);
  const [isSending, setIsSending] = useState(false);
  const [lastProvider, setLastProvider] = useState("-");
  const [lastModel, setLastModel] = useState("-");
  const [liveTranscript, setLiveTranscript] = useState(coachIntroMessage);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showStream, setShowStream] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showFeedbackPulse, setShowFeedbackPulse] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const lastRequestKeyRef = useRef("");
  const speechUtteranceRef = useRef(null);
  const bottomRef = useRef(null);
  const celebrationTimerRef = useRef(null);
  const streamAbortControllerRef = useRef(null);
  const {
    inputMode,
    isListening,
    isSupported: isSpeechInputSupported,
    isSecureOrigin,
    isTranscribing,
    lastError: speechInputError,
    stopListening,
    toggleListening,
  } = useSpeechInput({
    onTranscript: setInput,
    onError: (message) => toast.error(message),
    allowRecordedFallback: false,
  });

  const canSend = input.trim().length > 0 && !isSending;
  const intro = mode === "interview" ? interviewIntroMessage : coachIntroMessage;
  const pageTitle = mode === "interview" ? "AI Interview Studio" : "AI Coach Studio";
  const subTitle = mode === "interview" ? "Mock interview with spoken questions and feedback." : "Chat first, then switch to live AI explanation when needed.";
  const aiStatus = isLiveStreaming ? "Streaming live" : isSpeaking ? "Speaking" : "Camera ready";
  const micStatusLabel = isTranscribing
    ? "Transcribing..."
    : isListening
      ? inputMode === "recording"
        ? "Recording..."
        : "Listening..."
      : "Mic ready";
  const micHintText =
    inputMode === "recording"
      ? "Recorded transcription is disabled in Ollama mode."
      : "Voice input fills the text box live when browser speech recognition is available.";
  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant")?.content || intro;
  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content || "";

  const interviewFeedback = useMemo(() => {
    if (mode !== "interview" || messages.length < 3) return [];

    return [
      {
        title: "Question",
        value: lastAssistantMessage.slice(0, 120) || "Waiting for first question...",
      },
      {
        title: "Your Response",
        value: latestUserMessage.slice(0, 120) || "Answer the interviewer to unlock feedback.",
      },
      {
        title: "Coach Feedback",
        value: liveTranscript.slice(0, 140) || "Live feedback will appear here.",
      },
    ];
  }, [lastAssistantMessage, latestUserMessage, liveTranscript, messages.length, mode]);

  useEffect(() => {
    streamAbortControllerRef.current?.abort();
    streamAbortControllerRef.current = null;
    stopListening();
    const nextIntro = mode === "interview" ? interviewIntroMessage : coachIntroMessage;
    setMessages([{ role: "assistant", content: nextIntro }]);
    setLiveTranscript(nextIntro);
    setInput("");
    setShowStream(false);
    setIsChatOpen(false);
    setShowFeedbackPulse(false);
    setCelebrationMessage("");
    setIsSending(false);
    setIsLiveStreaming(false);
    lastRequestKeyRef.current = "";
  }, [mode, stopListening]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isChatOpen]);

  const stopSpeaking = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const speakText = (text) => {
    if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;

    stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      streamAbortControllerRef.current?.abort();
      stopListening();
      stopSpeaking();
      if (celebrationTimerRef.current) {
        window.clearTimeout(celebrationTimerRef.current);
      }
    };
  }, [stopListening]);

  const sendMessage = async (textOverride, options = {}) => {
    const userText = (textOverride ?? input).trim();
    if (!userText || isSending) return;

    const { openStream = false, collapseChat = false } = options;
    const requestKey = `${mode}|${topic}|${difficulty}|${userText.toLowerCase()}`;

    if (lastRequestKeyRef.current === requestKey) {
      toast("Same prompt already submitted. Edit question or wait for reply.");
      return;
    }

    lastRequestKeyRef.current = requestKey;

    const assistantIndex = messages.length + 1;
    const nextMessages = [...messages, { role: "user", content: userText }, { role: "assistant", content: "" }];
    const abortController = new AbortController();

    stopListening();
    streamAbortControllerRef.current?.abort();
    streamAbortControllerRef.current = abortController;

    if (openStream) {
      setShowStream(true);
      setIsChatOpen(!collapseChat);
    }

    setMessages(nextMessages);
    setInput("");
    setIsSending(true);
    setIsLiveStreaming(true);
    setLiveTranscript("");

    try {
      let finalReply = "";

      await aiApi.askCoachStream({
        mode,
        topic,
        difficulty,
        messages: nextMessages,
        allowLocalFallback: true,
        signal: abortController.signal,
        onEvent: (event) => {
          if (event.type === "meta") {
            setLastProvider(event.provider || "unknown");
            setLastModel(event.model || "unknown");
            return;
          }

          if (event.type === "delta") {
            finalReply += event.content || "";
            setLiveTranscript(finalReply);
            setMessages((prev) =>
              prev.map((message, index) =>
                index === assistantIndex ? { ...message, content: finalReply } : message
              )
            );
            return;
          }

          if (event.type === "done") {
            finalReply = event.reply || finalReply;
            setLastProvider(event.provider || "unknown");
            setLastModel(event.model || "unknown");
            setLiveTranscript(finalReply);
            setMessages((prev) =>
              prev.map((message, index) =>
                index === assistantIndex ? { ...message, content: finalReply } : message
              )
            );

            if (event.warnings?.length) {
              toast("Using local AI fallback because external quota is unavailable.");
            }
          }
        },
      });

      setIsLiveStreaming(false);
      if (streamAbortControllerRef.current === abortController) {
        streamAbortControllerRef.current = null;
      }
      if (finalReply) {
        speakText(finalReply);
      }

      if (mode === "interview") {
        setShowFeedbackPulse(true);
        window.setTimeout(() => setShowFeedbackPulse(false), 2200);

        const nextCelebration = getInterviewCelebration(finalReply, userText);
        setCelebrationMessage(nextCelebration || "");

        if (celebrationTimerRef.current) {
          window.clearTimeout(celebrationTimerRef.current);
        }

        if (nextCelebration) {
          celebrationTimerRef.current = window.setTimeout(() => {
            setCelebrationMessage("");
          }, 3600);
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      lastRequestKeyRef.current = "";
      setIsLiveStreaming(false);
      setMessages((prev) => prev.filter((_, index) => index !== assistantIndex));
      setLiveTranscript(messages.at(-1)?.content || intro);
      toast.error(error?.response?.data?.message || error?.message || "Failed to get AI response");
    } finally {
      if (streamAbortControllerRef.current === abortController) {
        streamAbortControllerRef.current = null;
      }
      setIsSending(false);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const startInterview = () => {
    setShowStream(true);
    setIsChatOpen(true);
    sendMessage(`Start a ${difficulty} level mock interview on ${topic}. Ask me the first question and wait for my answer.`, {
      openStream: true,
    });
  };

  const explainProblemLive = () => {
    stopListening();
    setShowStream(true);
    setIsChatOpen(false);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.08),transparent_24%),radial-gradient(circle_at_30%_10%,rgba(20,184,166,0.12),transparent_20%),#171311]">
      <Navbar />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[320px,minmax(0,1fr)]">
        <aside className="rounded-[28px] border border-white/8 bg-[#201918] shadow-2xl shadow-black/20">
          <div className="p-6">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">AI Studio</p>
              <h1 className="mt-2 text-2xl font-bold text-white">{pageTitle}</h1>
              <p className="mt-2 text-sm leading-6 text-stone-300">{subTitle}</p>
            </div>

            <div className="mb-5 flex rounded-2xl border border-white/10 bg-black/20 p-1">
              <button
                onClick={() => setMode("coach")}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  mode === "coach" ? "bg-emerald-500 text-black" : "text-stone-300"
                }`}
              >
                Coach
              </button>
              <button
                onClick={() => setMode("interview")}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  mode === "interview" ? "bg-emerald-500 text-black" : "text-stone-300"
                }`}
              >
                Interview
              </button>
            </div>

            <label className="mb-4 block">
              <span className="mb-2 block text-sm font-medium text-stone-200">Topic</span>
              <input
                type="text"
                className="w-full rounded-2xl border border-white/10 bg-[#120f0e] px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="System design, React, DSA..."
              />
            </label>

            <label className="mb-5 block">
              <span className="mb-2 block text-sm font-medium text-stone-200">Difficulty</span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-[#120f0e] px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>

            <div className="space-y-3">
              {mode === "interview" ? (
                <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-black transition hover:bg-emerald-400" onClick={startInterview}>
                  <SparklesIcon className="size-4" />
                  Start Interview
                </button>
              ) : null}

              <button
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/8 px-4 py-3 font-semibold text-emerald-200 transition hover:bg-emerald-400/14"
                onClick={explainProblemLive}
              >
                <VideoIcon className="size-4" />
                Explain As Live Stream
              </button>
            </div>

            <div className="mt-6 rounded-3xl border border-cyan-300/10 bg-[#110f14] p-4 text-sm text-stone-300">
              <div className="flex items-center gap-3">
                <div className={`flex size-11 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 ${isLiveStreaming || isSpeaking ? "animate-pulse" : ""}`}>
                  <BrainCircuitIcon className="size-5 text-emerald-300" />
                </div>
                <div>
                  <p className="font-semibold text-white">{showStream ? "Stream Mode" : "Chat Mode"}</p>
                  <p className="text-xs text-stone-400">{showStream ? aiStatus : "AI coach chat is active"}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {!showStream ? (
          <section className="rounded-[30px] border border-white/8 bg-[#1e1716] shadow-2xl shadow-black/20">
            <div className="border-b border-white/8 px-6 py-5">
              <h2 className="text-2xl font-bold text-white">AI Coach Chat</h2>
              <p className="mt-1 text-sm text-stone-400">{mode === "interview" ? "Answer the interviewer and get spoken feedback." : "Ask the coach anything before switching to live stream."}</p>
              <p className="mt-2 text-xs text-stone-500">
                Provider: {lastProvider} | Model: {lastModel}
              </p>
            </div>

            <div className="space-y-4 px-6 py-6">
              <div className="rounded-[26px] border border-emerald-300/15 bg-gradient-to-br from-emerald-400/10 via-cyan-400/8 to-transparent p-5 text-stone-100">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-11 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-300/10 ${isLiveStreaming || isSpeaking ? "animate-pulse" : ""}`}>
                      <BotIcon className="size-5 text-emerald-200" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Voice Coach</p>
                      <p className="text-xs text-stone-300">{isLiveStreaming ? "Composing response..." : isSpeaking ? "Replying with voice..." : "Ready to help"}</p>
                    </div>
                  </div>
                  <button
                    className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${voiceEnabled ? "bg-emerald-500 text-black" : "bg-white/6 text-white"}`}
                    onClick={() => {
                      const next = !voiceEnabled;
                      setVoiceEnabled(next);
                      if (!next) stopSpeaking();
                    }}
                  >
                    {voiceEnabled ? <MicIcon className="size-4" /> : <MicOffIcon className="size-4" />}
                    Voice
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-stone-300">
                  <span
                    className={`rounded-full px-3 py-1 ${
                      isListening || isTranscribing ? "bg-cyan-300 text-black" : "bg-white/8 text-stone-200"
                    }`}
                  >
                    {micStatusLabel}
                  </span>
                  <span className="text-stone-400">
                    Best in Chrome or Edge{!isSecureOrigin ? " on HTTPS or localhost" : ""}.
                  </span>
                </div>
                {speechInputError ? (
                  <p className="mt-3 text-xs leading-6 text-amber-200">{speechInputError}</p>
                ) : null}
              </div>

              <div className="max-h-[48vh] space-y-4 overflow-y-auto pr-1">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[78%] whitespace-pre-wrap rounded-[24px] px-5 py-4 text-sm leading-7 shadow-lg ${
                        message.role === "assistant"
                          ? "bg-[#0f2021] text-cyan-50 shadow-cyan-950/40"
                          : "bg-emerald-500 text-black shadow-emerald-950/20"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {isSending ? (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-[24px] bg-[#0f2021] px-5 py-4 text-sm text-cyan-50">
                      <Loader2Icon className="size-4 animate-spin" />
                      Thinking...
                    </div>
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>
            </div>

            <div className="border-t border-white/8 px-6 py-5">
              <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-stone-400">
                <span
                  className={`rounded-full px-3 py-1 ${
                    isListening || isTranscribing ? "bg-cyan-300 text-black" : "bg-white/8 text-stone-200"
                  }`}
                >
                  {isListening || isTranscribing ? micStatusLabel : "Tap mic to speak"}
                </span>
                <span>{micHintText}</span>
              </div>
              {speechInputError ? (
                <p className="mb-3 text-xs leading-6 text-amber-200">{speechInputError}</p>
              ) : null}
              <div className="flex items-end gap-3">
                <textarea
                  rows={3}
                  className="min-h-[110px] w-full rounded-[24px] border border-white/10 bg-[#120f0e] px-4 py-4 text-white outline-none transition focus:border-emerald-400"
                  placeholder={mode === "interview" ? "Answer the AI interviewer or ask to start the first question..." : "Ask the AI coach to teach you, quiz you, or explain a concept..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                />
                <button
                  type="button"
                  className={`flex size-14 shrink-0 items-center justify-center rounded-2xl border transition ${
                    isListening
                      ? "border-cyan-300 bg-cyan-300 text-black"
                      : "border-white/10 bg-[#161110] text-white hover:border-emerald-400/60"
                  } ${!isSpeechInputSupported ? "cursor-not-allowed opacity-50" : ""}`}
                  disabled={!isSpeechInputSupported}
                  onClick={() => toggleListening(input)}
                  title={isListening ? "Stop voice input" : "Speak your message"}
                >
                  {isListening ? <MicOffIcon className="size-5" /> : <MicIcon className="size-5" />}
                </button>
                <button
                  className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/40 disabled:text-stone-400"
                  disabled={!canSend}
                  onClick={() => sendMessage()}
                >
                  {isSending ? <Loader2Icon className="size-5 animate-spin" /> : <SendIcon className="size-5" />}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-[30px] border border-white/8 bg-[#1d1716] shadow-2xl shadow-black/20">
            <div className="border-b border-white/8 px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">AI Bot Stream</h2>
                  <p className="mt-1 text-sm text-stone-400">
                    Live avatar front and center. Open chat only when you need it.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${voiceEnabled ? "bg-emerald-500 text-black" : "bg-white/6 text-white"}`}
                    onClick={() => {
                      const next = !voiceEnabled;
                      setVoiceEnabled(next);
                      if (!next) stopSpeaking();
                    }}
                  >
                    {voiceEnabled ? <MicIcon className="size-4" /> : <MicOffIcon className="size-4" />}
                    Voice
                  </button>
                  <button
                    className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${isChatOpen ? "bg-cyan-400 text-black" : "bg-white/6 text-white"}`}
                    onClick={() => setIsChatOpen((prev) => !prev)}
                  >
                    {isChatOpen ? <XIcon className="size-4" /> : <MessageSquareIcon className="size-4" />}
                    Chat
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-5">
                <SimliAvatarTile
                  title={mode === "interview" ? "AI Interview Camera" : "AI Coach Camera"}
                  statusText={aiStatus}
                  accentActive={isLiveStreaming || isSpeaking}
                  className="mx-auto w-full max-w-[420px] overflow-hidden rounded-[28px] border border-cyan-400/12"
                  mediaClassName="h-[460px] min-h-[460px] object-cover object-bottom bg-[#0a1220] md:h-[520px] md:min-h-[520px]"
                />

                <div className="rounded-[28px] border border-cyan-300/16 bg-[#0f1b2d] p-5 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.26em] text-cyan-200/70">Live Transcript</p>
                    <span className={`rounded-full px-3 py-1 text-xs ${isLiveStreaming || isSpeaking ? "bg-emerald-400/20 text-emerald-200" : "bg-white/8 text-stone-200"}`}>
                      {isLiveStreaming ? "Streaming" : isSpeaking ? "Speaking" : "Ready"}
                    </span>
                  </div>
                  <div className="mt-4 min-h-[150px] whitespace-pre-wrap text-base leading-8 text-stone-100">
                    {liveTranscript || "The live transcript will appear here while the avatar speaks."}
                  </div>
                </div>

                {mode === "interview" ? (
                  <div className={`rounded-[28px] border p-5 transition ${showFeedbackPulse ? "border-emerald-400 bg-emerald-400/10 feedback-glow" : "border-amber-300/12 bg-[#251d14]"}`}>
                    <div className="mb-4 flex items-center gap-3">
                      <div className={`flex size-11 items-center justify-center rounded-2xl ${showFeedbackPulse ? "bg-emerald-400 text-black" : "bg-amber-400/10 text-amber-200"}`}>
                        <SparklesIcon className={`size-5 ${showFeedbackPulse ? "feedback-bounce" : ""}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Interview Feedback</h3>
                        <p className="text-sm text-stone-400">Every reply turns into spoken coaching and visual feedback.</p>
                      </div>
                    </div>

                    {celebrationMessage ? (
                      <div className="celebration-shell mb-4 overflow-hidden rounded-[24px] border border-emerald-300/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.22),rgba(34,211,238,0.16),rgba(250,204,21,0.18))] px-4 py-4 text-white">
                        <div className="celebration-orb celebration-orb-left" />
                        <div className="celebration-orb celebration-orb-right" />
                        <div className="relative flex items-center gap-3">
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-black/20 text-emerald-100">
                            <SparklesIcon className="size-5 celebration-badge-spin" />
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-emerald-50/80">Appreciation</p>
                            <p className="mt-1 text-sm font-medium leading-6 text-white">{celebrationMessage}</p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="grid gap-3 md:grid-cols-3">
                      {interviewFeedback.map((item) => (
                        <div key={item.title} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{item.title}</p>
                          <p className="mt-3 line-clamp-5 text-sm leading-6 text-stone-100">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <aside className={`rounded-[28px] border border-white/8 bg-[#120f14] transition-all duration-300 ${isChatOpen ? "opacity-100" : "pointer-events-none opacity-45"}`}>
                <div className="border-b border-white/8 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">{mode === "interview" ? "Interview Chat" : "Coach Chat"}</h3>
                      <p className="text-xs text-stone-400">
                        Provider: {lastProvider} | Model: {lastModel}
                      </p>
                    </div>
                    {!isChatOpen ? (
                      <span className="rounded-full bg-white/6 px-3 py-1 text-xs text-stone-300">Closed</span>
                    ) : null}
                  </div>
                </div>

                {isChatOpen ? (
                  <>
                    <div className="max-h-[420px] space-y-4 overflow-y-auto px-5 py-5">
                      {messages.map((message, index) => (
                        <div key={`${message.role}-${index}`} className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
                          <div
                            className={`max-w-[90%] whitespace-pre-wrap rounded-[22px] px-4 py-3 text-sm leading-6 ${
                              message.role === "assistant" ? "bg-[#102428] text-cyan-50" : "bg-emerald-500 text-black"
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      ))}

                      {isSending ? (
                        <div className="flex justify-start">
                          <div className="flex items-center gap-2 rounded-[22px] bg-[#102428] px-4 py-3 text-sm text-cyan-50">
                            <Loader2Icon className="size-4 animate-spin" />
                            Responding...
                          </div>
                        </div>
                      ) : null}
                      <div ref={bottomRef} />
                    </div>

                    <div className="border-t border-white/8 p-4">
                      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-stone-400">
                        <span
                          className={`rounded-full px-3 py-1 ${
                            isListening || isTranscribing ? "bg-cyan-300 text-black" : "bg-white/8 text-stone-200"
                          }`}
                        >
                          {isListening || isTranscribing ? micStatusLabel : "Tap mic to speak"}
                        </span>
                        <span>
                          {inputMode === "recording"
                            ? "Recorded transcription is disabled in Ollama mode."
                            : "Speak your follow-up and it will appear in the chat box when browser speech recognition is available."}
                        </span>
                      </div>
                      {speechInputError ? (
                        <p className="mb-3 text-xs leading-6 text-amber-200">{speechInputError}</p>
                      ) : null}
                      <div className="flex items-end gap-3">
                        <textarea
                          rows={3}
                          className="min-h-[98px] w-full rounded-[22px] border border-white/10 bg-[#0c0a0f] px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                          placeholder={mode === "interview" ? "Answer the current interview question..." : "Ask a follow-up while the avatar is speaking..."}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={onKeyDown}
                        />
                        <button
                          type="button"
                          className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border transition ${
                            isListening
                              ? "border-cyan-300 bg-cyan-300 text-black"
                              : "border-white/10 bg-[#151118] text-white hover:border-emerald-400/60"
                          } ${!isSpeechInputSupported ? "cursor-not-allowed opacity-50" : ""}`}
                          disabled={!isSpeechInputSupported}
                          onClick={() => toggleListening(input)}
                          title={isListening ? "Stop voice input" : "Speak your message"}
                        >
                          {isListening ? <MicOffIcon className="size-4" /> : <MicIcon className="size-4" />}
                        </button>
                        <button
                          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/40 disabled:text-stone-400"
                          disabled={!canSend}
                          onClick={() => sendMessage()}
                        >
                          {isSending ? <Loader2Icon className="size-4 animate-spin" /> : <SendIcon className="size-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-[540px] flex-col items-center justify-center px-8 text-center">
                    <div className="flex size-16 items-center justify-center rounded-3xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                      <MessageSquareIcon className="size-7" />
                    </div>
                    <p className="mt-5 text-lg font-semibold text-white">Chat hidden</p>
                    <p className="mt-2 text-sm leading-6 text-stone-400">
                      Keep the avatar focused. Open chat when you want to ask a question or answer the interviewer.
                    </p>
                  </div>
                )}
              </aside>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default AiCoachPage;
