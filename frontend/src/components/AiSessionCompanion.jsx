import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  BotIcon,
  Loader2Icon,
  MicIcon,
  MicOffIcon,
  SendIcon,
  SparklesIcon,
  VideoIcon,
} from "lucide-react";
import { aiApi } from "../api/ai";
import SimliAvatarTile from "./SimliAvatarTile";
import useSpeechInput from "../hooks/useSpeechInput";

const coachIntro =
  "AI coach is ready in the room. Ask a question and I will answer directly with a clear teaching-style explanation.";

const interviewIntro =
  "AI interviewer is ready in the room. I will ask one question at a time, then give feedback on communication, basic knowledge, and improvements.";

function AiSessionCompanion({ topic = "Data Structures and Algorithms", difficulty = "medium" }) {
  const [mode, setMode] = useState("coach");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ role: "assistant", content: coachIntro }]);
  const [liveTranscript, setLiveTranscript] = useState(coachIntro);
  const [isSending, setIsSending] = useState(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastProvider, setLastProvider] = useState("-");
  const [lastModel, setLastModel] = useState("-");
  const bottomRef = useRef(null);
  const speechUtteranceRef = useRef(null);
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
  const title = useMemo(
    () => (mode === "interview" ? "AI Interview Participant" : "AI Coach Participant"),
    [mode]
  );
  const aiStatus = isLiveStreaming ? "Streaming live" : isSpeaking ? "Speaking" : "Camera ready";
  const micStatusLabel = isTranscribing
    ? "Transcribing..."
    : isListening
      ? inputMode === "recording"
        ? "Recording..."
        : "Listening..."
      : "Mic ready";

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
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, liveTranscript]);

  useEffect(() => {
    return () => {
      streamAbortControllerRef.current?.abort();
      stopListening();
      stopSpeaking();
    };
  }, [stopListening]);

  useEffect(() => {
    streamAbortControllerRef.current?.abort();
    streamAbortControllerRef.current = null;
    stopListening();
    const intro = mode === "interview" ? interviewIntro : coachIntro;
    setMessages([{ role: "assistant", content: intro }]);
    setLiveTranscript(intro);
    setIsSending(false);
    setIsLiveStreaming(false);
  }, [mode, stopListening]);

  const sendMessage = async (textOverride) => {
    const userText = (textOverride ?? input).trim();
    if (!userText || isSending) return;

    const assistantIndex = messages.length + 1;
    const nextMessages = [...messages, { role: "user", content: userText }, { role: "assistant", content: "" }];
    const abortController = new AbortController();

    stopListening();
    streamAbortControllerRef.current?.abort();
    streamAbortControllerRef.current = abortController;

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
              console.warn("AI fallback warnings:", event.warnings);
            }
          }
        },
      });

      setIsLiveStreaming(false);
      if (streamAbortControllerRef.current === abortController) {
        streamAbortControllerRef.current = null;
      }
      if (finalReply) speakText(finalReply);
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      setIsLiveStreaming(false);
      setMessages((prev) => prev.filter((_, index) => index !== assistantIndex));
      setLiveTranscript(messages.at(-1)?.content || coachIntro);
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
    sendMessage(`Start a ${difficulty} mock interview on ${topic}. Ask me the first question.`);
  };

  const explainLive = () => {
    stopListening();
    sendMessage(
      `Teach me ${topic} at ${difficulty} level like a live tutor. Answer directly, then explain with one simple example.`
    );
  };

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 shadow-lg h-full flex flex-col overflow-hidden">
      <div className="border-b border-base-300 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`size-12 rounded-2xl border border-primary/40 bg-primary/10 flex items-center justify-center ${
                isLiveStreaming || isSpeaking ? "animate-pulse" : ""
              }`}
            >
              <BotIcon className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base-content">{title}</h2>
              <p className="text-xs text-base-content/60">
                Provider: {lastProvider} | Model: {lastModel}
              </p>
            </div>
          </div>

          <button
            className={`btn btn-sm ${voiceEnabled ? "btn-primary" : "btn-outline"}`}
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

        <div className="join mt-4 w-full">
          <button
            className={`join-item btn flex-1 ${mode === "coach" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setMode("coach")}
          >
            Coach
          </button>
          <button
            className={`join-item btn flex-1 ${mode === "interview" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setMode("interview")}
          >
            Interview
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn btn-sm btn-outline" onClick={explainLive} disabled={isSending}>
            <VideoIcon className="size-4" />
            Live Explain
          </button>
          {mode === "interview" && (
            <button className="btn btn-sm btn-secondary" onClick={startInterview} disabled={isSending}>
              <SparklesIcon className="size-4" />
              Start Interview
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-base-content/70">
          <span className={`badge ${isListening || isTranscribing ? "badge-accent text-black" : "badge-outline"}`}>
            {micStatusLabel}
          </span>
          <span>Best in Chrome or Edge{!isSecureOrigin ? " on HTTPS or localhost" : ""}.</span>
        </div>
        {speechInputError ? (
          <p className="mt-2 text-xs leading-6 text-warning">{speechInputError}</p>
        ) : null}
      </div>

      <div className="px-4 pt-4">
        <SimliAvatarTile
          title={mode === "interview" ? "AI Interview Camera" : "AI Coach Camera"}
          statusText={aiStatus}
          accentActive={isLiveStreaming || isSpeaking}
        />

        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Live Transcript</p>
          <div className="mt-2 min-h-[96px] whitespace-pre-wrap text-sm leading-relaxed">
            {liveTranscript || "AI speech transcript will appear here..."}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`chat ${message.role === "assistant" ? "chat-start" : "chat-end"}`}
          >
            <div
              className={`chat-bubble whitespace-pre-wrap ${
                message.role === "assistant"
                  ? "chat-bubble-primary text-primary-content"
                  : "chat-bubble-secondary text-secondary-content"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="chat chat-start">
            <div className="chat-bubble chat-bubble-primary text-primary-content flex items-center gap-2">
              <Loader2Icon className="size-4 animate-spin" />
              AI is responding...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-base-300 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-base-content/70">
          <span className={`badge ${isListening || isTranscribing ? "badge-accent text-black" : "badge-outline"}`}>
            {isListening || isTranscribing ? micStatusLabel : "Tap mic to speak"}
          </span>
          <span>
            {inputMode === "recording"
              ? "Recorded transcription is disabled in Ollama mode."
              : "Voice input writes directly into the chat box when browser speech recognition is available."}
          </span>
        </div>
        {speechInputError ? (
          <p className="mb-3 text-xs leading-6 text-warning">{speechInputError}</p>
        ) : null}
        <div className="flex items-end gap-3">
          <textarea
            rows={2}
            className="textarea textarea-bordered w-full"
            placeholder={
              mode === "interview"
                ? "Answer the AI interviewer or ask to begin the mock interview..."
                : "Ask the AI coach to teach you a topic or explain the current problem..."
            }
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
          />

          <button
            type="button"
            className={`btn ${isListening ? "btn-accent" : "btn-outline"} ${!isSpeechInputSupported ? "btn-disabled" : ""}`}
            disabled={!isSpeechInputSupported}
            onClick={() => toggleListening(input)}
            title={isListening ? "Stop voice input" : "Speak your message"}
          >
            {isListening ? <MicOffIcon className="size-4" /> : <MicIcon className="size-4" />}
          </button>

          <button className="btn btn-primary" disabled={!canSend} onClick={() => sendMessage()}>
            {isSending ? <Loader2Icon className="size-4 animate-spin" /> : <SendIcon className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AiSessionCompanion;
