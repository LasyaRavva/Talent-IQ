import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { BotIcon, Loader2Icon, MicIcon, MicOffIcon, SendIcon, SparklesIcon, VideoIcon } from "lucide-react";
import Navbar from "../components/Navbar";
import { aiApi } from "../api/ai";

const coachIntroMessage =
  "Hi, I am your AI coach. Ask any coding or interview-prep question and I will answer it directly with a clear explanation.";

const interviewIntroMessage =
  "Interview mode is active. I will ask one question at a time, wait for your answer, and then give feedback on communication, basic knowledge, and improvements.";

const initialCoachMessage = {
  role: "assistant",
  content: coachIntroMessage,
};

function AiCoachPage() {
  const [mode, setMode] = useState("coach");
  const [topic, setTopic] = useState("Data Structures and Algorithms");
  const [difficulty, setDifficulty] = useState("medium");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([initialCoachMessage]);
  const [isSending, setIsSending] = useState(false);
  const [lastProvider, setLastProvider] = useState("-");
  const [lastModel, setLastModel] = useState("-");
  const [liveTranscript, setLiveTranscript] = useState(initialCoachMessage.content);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastRequestKeyRef = useRef("");
  const speechUtteranceRef = useRef(null);

  const canSend = input.trim().length > 0 && !isSending;

  const emptyStateTitle = useMemo(() => {
    return mode === "interview" ? "Start your mock interview" : "Ask your coding question";
  }, [mode]);

  useEffect(() => {
    const intro = mode === "interview" ? interviewIntroMessage : coachIntroMessage;
    setMessages([{ role: "assistant", content: intro }]);
    setLiveTranscript(intro);
    lastRequestKeyRef.current = "";
  }, [mode]);

  const stopSpeaking = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const speakText = (text) => {
    if (!voiceEnabled) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

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
      stopSpeaking();
    };
  }, []);

  const sendMessage = async () => {
    const userText = input.trim();
    if (!userText || isSending) return;

    const requestKey = `${mode}|${topic}|${difficulty}|${userText.toLowerCase()}`;
    if (lastRequestKeyRef.current === requestKey) {
      toast("Same prompt already submitted. Edit question or wait for reply.");
      return;
    }

    lastRequestKeyRef.current = requestKey;

    const assistantIndex = messages.length + 1;
    const nextMessages = [
      ...messages,
      { role: "user", content: userText },
      { role: "assistant", content: "" },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);
    setLiveTranscript("");
    setIsLiveStreaming(true);

    try {
      let finalReply = "";

      await aiApi.askCoachStream({
        mode,
        topic,
        difficulty,
        messages: nextMessages,
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
              console.warn("AI stream warnings:", event.warnings);
            }
          }
        },
      });
      setIsLiveStreaming(false);
      if (finalReply) {
        speakText(finalReply);
      }
    } catch (error) {
      lastRequestKeyRef.current = "";
      setIsLiveStreaming(false);
      setMessages((prev) => prev.filter((_, index) => index !== assistantIndex));
      setLiveTranscript(messages.at(-1)?.content || initialCoachMessage.content);
      toast.error(error?.response?.data?.message || error?.message || "Failed to get AI response");
    } finally {
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
    const starter = {
      role: "user",
      content: `Start a ${difficulty} level mock interview on ${topic}. Ask me the first question.`,
    };

    setInput(starter.content);
  };

  const explainProblemLive = () => {
    const prompt = `Explain this ${difficulty} ${topic} coding problem like a live tutor. Cover intuition, step-by-step approach, time and space complexity, and a short code template.`;
    setInput(prompt);
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[320px,1fr] gap-6">
        <aside className="card bg-base-100 shadow-xl h-fit">
          <div className="card-body">
            <h2 className="card-title flex items-center gap-2">
              <BotIcon className="size-5 text-primary" />
              AI Learning Studio
            </h2>

            <p className="text-sm text-base-content/70">
              Learn with guided teaching mode or run realistic interview practice.
            </p>

            <div className="join w-full">
              <button
                onClick={() => setMode("coach")}
                className={`join-item btn flex-1 ${mode === "coach" ? "btn-primary" : "btn-outline"}`}
              >
                Coach
              </button>
              <button
                onClick={() => setMode("interview")}
                className={`join-item btn flex-1 ${mode === "interview" ? "btn-primary" : "btn-outline"}`}
              >
                Interview
              </button>
            </div>

            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Topic</span>
              </div>
              <input
                type="text"
                className="input input-bordered"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="System design, React, DSA..."
              />
            </label>

            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Difficulty</span>
              </div>
              <select
                className="select select-bordered"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>

            {mode === "interview" && (
              <button className="btn btn-secondary" onClick={startInterview}>
                <SparklesIcon className="size-4" />
                Generate First Question
              </button>
            )}

            <button className="btn btn-outline" onClick={explainProblemLive}>
              <VideoIcon className="size-4" />
              Explain As Live Stream
            </button>
          </div>
        </aside>

        <section className="card bg-base-100 shadow-xl min-h-[70vh]">
          <div className="card-body p-0">
            <div className="px-6 py-4 border-b border-base-300">
              <h1 className="text-2xl font-bold">AI Coach Chat</h1>
              <p className="text-sm text-base-content/70">{emptyStateTitle}</p>
              <p className="text-xs text-base-content/60 mt-1">
                Provider: {lastProvider} | Model: {lastModel}
              </p>
            </div>

            <div className="px-6 pt-6">
              <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-10 rounded-full bg-primary/30 border border-primary/60 flex items-center justify-center ${
                        isLiveStreaming || isSpeaking ? "animate-pulse" : ""
                      }`}
                    >
                      <BotIcon className="size-5 text-primary-content" />
                    </div>
                    <div>
                      <p className="font-semibold">AI Tutor Live Stream</p>
                      <p className="text-xs text-slate-300">
                        {isLiveStreaming ? "Streaming explanation..." : isSpeaking ? "Speaking..." : "Ready"}
                      </p>
                    </div>
                  </div>

                  <button
                    className={`btn btn-sm ${voiceEnabled ? "btn-primary" : "btn-ghost text-white"}`}
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

                <div className="mt-3 rounded-xl bg-black/30 border border-white/10 p-3 min-h-[88px] text-sm leading-relaxed whitespace-pre-wrap">
                  {liveTranscript || "AI tutor transcript will appear here..."}
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[42vh]">
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
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-base-300">
              <div className="flex items-end gap-3">
                <textarea
                  rows={2}
                  className="textarea textarea-bordered w-full"
                  placeholder="Ask AI to teach, quiz, or interview you..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                />

                <button className="btn btn-primary" disabled={!canSend} onClick={sendMessage}>
                  {isSending ? <Loader2Icon className="size-4 animate-spin" /> : <SendIcon className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AiCoachPage;
