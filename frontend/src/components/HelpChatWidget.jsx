import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useUser } from "@clerk/clerk-react";
import {
  ArrowRightIcon,
  LifeBuoyIcon,
  MessageCircleIcon,
  SendHorizonalIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";

const quickActions = [
  { label: "Start here", query: "How do I start using this website?" },
  { label: "Practice problems", query: "Where can I solve coding problems?" },
  { label: "AI coach", query: "How do I use the AI coach?" },
  { label: "Live session", query: "How do I create or join a live session?" },
];

const routeGuide = {
  "/": "You are on the landing page. This is the best place to understand the platform and get started.",
  "/services": "You are on the services page. It explains what Talent IQ offers and how each feature helps with interview prep.",
  "/dashboard": "You are on the dashboard. This is the control center for creating rooms, joining by code, and checking recent sessions.",
  "/problems": "You are on the problems page. Pick a challenge here when you want focused coding practice.",
  "/ai-coach": "You are on the AI Coach page. Use it for mock interviews, explanations, and guided interview prep.",
};

const helpDatabase = [
  {
    patterns: ["start", "begin", "new user", "first time", "how do i start"],
    reply: ({ isSignedIn }) =>
      isSignedIn
        ? {
            text: "Start with the dashboard to create a room or join one by code. If you want guided practice first, open AI Coach. If you want solo problem solving, go to Problems.",
            actions: [
              { label: "Open Dashboard", to: "/dashboard" },
              { label: "Open AI Coach", to: "/ai-coach" },
              { label: "Open Problems", to: "/problems" },
            ],
          }
        : {
            text: "If you are new here, explore the Services page to understand the platform, then sign in to access the dashboard, AI Coach, problems, and live coding sessions.",
            actions: [
              { label: "View Services", to: "/services" },
              { label: "Go Home", to: "/" },
            ],
          },
  },
  {
    patterns: ["problem", "practice", "coding question", "solve", "dsa"],
    reply: () => ({
      text: "Use the Problems page for coding practice. You can browse curated questions by difficulty and open a dedicated problem workspace to solve them.",
      actions: [{ label: "Open Problems", to: "/problems" }],
    }),
  },
  {
    patterns: ["ai", "coach", "interview", "mock interview", "feedback"],
    reply: () => ({
      text: "Use AI Coach when you want concept explanations, mock interview questions, live responses, or feedback on how you answer technical prompts.",
      actions: [{ label: "Open AI Coach", to: "/ai-coach" }],
    }),
  },
  {
    patterns: ["session", "room", "join", "invite", "code", "collaboration", "pair programming"],
    reply: () => ({
      text: "Live sessions are managed from the dashboard. You can create a coding room there or join an existing one using a room code, then collaborate through video and code editing.",
      actions: [{ label: "Open Dashboard", to: "/dashboard" }],
    }),
  },
  {
    patterns: ["service", "what do you provide", "what is this project", "about project"],
    reply: () => ({
      text: "Talent IQ is built for coding interview preparation. It combines practice problems, live collaborative sessions, video-based coding rooms, and AI coaching in one platform.",
      actions: [{ label: "View Services", to: "/services" }],
    }),
  },
  {
    patterns: ["dashboard", "recent session", "active session"],
    reply: () => ({
      text: "The dashboard is the main workspace for signed-in users. It shows active sessions, recent sessions, and the controls for creating or joining rooms.",
      actions: [{ label: "Open Dashboard", to: "/dashboard" }],
    }),
  },
];

const getContextHint = (pathname) => {
  if (routeGuide[pathname]) return routeGuide[pathname];
  if (pathname.startsWith("/problem/")) {
    return "You are on a problem workspace. This page is for solving one coding question in detail.";
  }
  if (pathname.startsWith("/session/")) {
    return "You are inside a live session. This area is for real-time collaboration, coding, and discussion.";
  }
  return "I can guide you to the right feature, explain what each page does, and help new users navigate the platform.";
};

function buildAssistantReply(rawInput, pathname, isSignedIn) {
  const normalized = rawInput.toLowerCase().trim();
  const match = helpDatabase.find((entry) =>
    entry.patterns.some((pattern) => normalized.includes(pattern))
  );

  if (match) {
    return match.reply({ pathname, isSignedIn });
  }

  return {
    text: `${getContextHint(pathname)} Try asking about problems, AI Coach, services, dashboard, or live sessions.`,
    actions: [
      { label: "Services", to: "/services" },
      ...(isSignedIn ? [{ label: "Dashboard", to: "/dashboard" }] : []),
      { label: "Problems", to: "/problems" },
    ],
  };
}

function HelpChatWidget() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => [
    {
      id: 1,
      role: "assistant",
      text: "Hi, I’m the Talent IQ help assistant. I can guide new users to the right page and explain what each part of the website does.",
      actions: [
        { label: "Services", to: "/services" },
        ...(isSignedIn ? [{ label: "Dashboard", to: "/dashboard" }] : []),
      ],
    },
  ]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    setMessages((prev) => {
      const alreadyHasContext = prev.some(
        (message) => message.role === "assistant" && message.metaPath === location.pathname
      );

      if (alreadyHasContext) return prev;

      return [
        ...prev,
        {
          id: Date.now(),
          role: "assistant",
          text: getContextHint(location.pathname),
          metaPath: location.pathname,
        },
      ];
    });
  }, [location.pathname]);

  const placeholder = useMemo(() => {
    if (location.pathname.startsWith("/session/")) return "Ask how sessions work...";
    if (location.pathname === "/ai-coach") return "Ask how to use AI Coach...";
    return "Ask where to go or how to use the site...";
  }, [location.pathname]);

  const submitMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const nextUserMessage = {
      id: Date.now(),
      role: "user",
      text: trimmed,
    };

    const reply = buildAssistantReply(trimmed, location.pathname, isSignedIn);
    const nextAssistantMessage = {
      id: Date.now() + 1,
      role: "assistant",
      text: reply.text,
      actions: reply.actions || [],
    };

    setMessages((prev) => [...prev, nextUserMessage, nextAssistantMessage]);
    setInput("");
  };

  return (
    <div className="fixed bottom-5 right-5 z-[70]">
      {isOpen ? (
        <div className="help-chat-shell flex h-[580px] w-[360px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[28px] border border-white/12 bg-[#0f1218]/94 text-white shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(34,197,94,0.16),rgba(56,189,248,0.12))] px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-11 items-center justify-center rounded-2xl bg-white/10">
                <LifeBuoyIcon className="size-5 text-[#86efac]" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/50">Help Chat</p>
                <h2 className="mt-1 text-lg font-semibold">Talent IQ Guide</h2>
                <p className="mt-1 text-sm leading-6 text-white/66">
                  Navigation help for new users across the whole website.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-white/12 bg-white/8 p-2 text-white/72 transition-colors hover:bg-white/12"
            >
              <XIcon className="size-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[88%] rounded-[22px] px-4 py-3 text-sm leading-7 ${
                    message.role === "assistant"
                      ? "bg-white/8 text-white/82"
                      : "bg-[linear-gradient(135deg,#f59e0b,#22c55e)] text-slate-950"
                  }`}
                >
                  <p>{message.text}</p>

                  {message.actions?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.actions.map((action) => (
                        <button
                          key={`${message.id}-${action.to}-${action.label}`}
                          type="button"
                          onClick={() => navigate(action.to)}
                          className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-black/20 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-black/30"
                        >
                          {action.label}
                          <ArrowRightIcon className="size-3.5" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 px-4 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => submitMessage(action.query)}
                  className="rounded-full border border-white/12 bg-white/7 px-3 py-1.5 text-xs font-medium text-white/76 transition-colors hover:bg-white/12"
                >
                  {action.label}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-3">
              <textarea
                rows={2}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submitMessage(input);
                  }
                }}
                placeholder={placeholder}
                className="min-h-[86px] w-full rounded-[22px] border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-[#86efac]"
              />
              <button
                type="button"
                onClick={() => submitMessage(input)}
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f59e0b,#22c55e)] text-slate-950 transition-transform hover:scale-105"
              >
                <SendHorizonalIcon className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="help-chat-trigger group relative flex items-center rounded-full border border-white/12 bg-[#0f1218]/92 p-2 text-white shadow-[0_22px_55px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-transform duration-300 hover:scale-105"
          aria-label="Open help chat"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f59e0b,#22c55e,#38bdf8)] text-white">
            <MessageCircleIcon className="size-5" />
          </div>

          <div className="help-chat-trigger-label overflow-hidden text-left">
            <p className="text-sm font-semibold">Need help?</p>
            <p className="text-xs text-white/56">Ask for navigation guidance</p>
          </div>

          <div className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-[#86efac] text-slate-950">
            <SparklesIcon className="size-3.5" />
          </div>
        </button>
      )}
    </div>
  );
}

export default HelpChatWidget;
