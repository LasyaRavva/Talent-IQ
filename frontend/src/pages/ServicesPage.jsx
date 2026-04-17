import { Link } from "react-router";
import {
  ArrowRightIcon,
  BotIcon,
  BrainCircuitIcon,
  Code2Icon,
  LayoutDashboardIcon,
  MessageSquareCodeIcon,
  MonitorPlayIcon,
  ScanSearchIcon,
  SparklesIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react";
import { SignInButton, useUser } from "@clerk/clerk-react";
import Navbar from "../components/Navbar";

const services = [
  {
    title: "Live Coding Interviews",
    description:
      "Create collaborative interview rooms with face-to-face communication, shared code editing, and structured problem-solving in one workflow.",
    icon: VideoIcon,
    accent: "from-[#f59e0b] via-[#f97316] to-[#ef4444]",
  },
  {
    title: "AI Coach Studio",
    description:
      "Practice with an AI coach that can explain concepts, run mock interviews, stream feedback, and help candidates improve confidence and clarity.",
    icon: BotIcon,
    accent: "from-[#22c55e] via-[#14b8a6] to-[#06b6d4]",
  },
  {
    title: "Problem Practice Library",
    description:
      "Browse coding problems, open guided workspaces, and move from solo practice into live collaborative sessions without losing momentum.",
    icon: Code2Icon,
    accent: "from-[#38bdf8] via-[#6366f1] to-[#8b5cf6]",
  },
  {
    title: "Session Dashboard",
    description:
      "Track active sessions, recent collaboration rooms, and your learning flow from preparation to mock interview to review.",
    icon: LayoutDashboardIcon,
    accent: "from-[#f43f5e] via-[#ec4899] to-[#a855f7]",
  },
  {
    title: "Real-Time Pair Collaboration",
    description:
      "Use shared editing, instant discussion, and synchronized context to mimic the pace of real technical rounds and peer practice.",
    icon: UsersIcon,
    accent: "from-[#84cc16] via-[#22c55e] to-[#14b8a6]",
  },
  {
    title: "Interview Feedback Loop",
    description:
      "Turn answers into feedback with coaching prompts, structured improvement notes, and conversational follow-ups that keep practice actionable.",
    icon: MessageSquareCodeIcon,
    accent: "from-[#fb7185] via-[#f97316] to-[#facc15]",
  },
  {
    title: "Resume Checker",
    description:
      "Compare your resume against a job description in real time, identify evidence-backed strengths and gaps, and generate safer rewrite suggestions without inventing experience.",
    icon: ScanSearchIcon,
    accent: "from-[#38bdf8] via-[#14b8a6] to-[#22c55e]",
  },
];

const deliveryPoints = [
  "Built for candidates preparing for coding interviews, pair-programming rounds, and technical discussions.",
  "Combines live communication, code execution, practice problems, and AI guidance in a single experience.",
  "Focuses on confidence building, clearer explanations, stronger technical reasoning, and faster iteration.",
];

function ServicesPage() {
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#120f16_0%,#171419_28%,#0d1218_100%)] text-white">
      {isSignedIn ? (
        <Navbar />
      ) : (
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#120f16]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <Link to="/" className="group flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02]">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f59e0b,#22c55e,#38bdf8)] shadow-[0_10px_30px_rgba(56,189,248,0.25)]">
                <SparklesIcon className="size-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="bg-[linear-gradient(90deg,#fde68a,#86efac,#7dd3fc)] bg-clip-text font-mono text-xl font-black tracking-wider text-transparent">
                  Talent IQ
                </span>
                <span className="-mt-1 text-xs text-white/55">Code Together</span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to="/services"
                className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-white/85"
              >
                Services
              </Link>
              <SignInButton mode="redirect">
                <button className="rounded-full bg-[linear-gradient(90deg,#f59e0b,#22c55e)] px-5 py-2.5 text-sm font-semibold text-slate-950 transition-transform duration-300 hover:scale-105">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </div>
        </nav>
      )}

      <section className="service-hero relative">
        <div className="service-orb service-orb-amber" />
        <div className="service-orb service-orb-cyan" />
        <div className="service-grid-lines" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
              <BrainCircuitIcon className="size-4 text-[#86efac]" />
              Interview practice, live collaboration, and AI coaching
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-black leading-[0.98] sm:text-6xl lg:text-7xl">
                Services that turn
                <span className="bg-[linear-gradient(90deg,#fcd34d,#86efac,#7dd3fc)] bg-clip-text text-transparent">
                  {" "}
                  interview prep
                </span>
                into a more human, real-time experience.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-white/68 sm:text-xl">
                Talent IQ is a collaborative interview-preparation platform where learners can
                practice coding, join live sessions, solve problems together, and use AI coaching
                to sharpen both technical and communication skills.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              {isSignedIn ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(90deg,#f59e0b,#22c55e)] px-6 py-3.5 text-sm font-semibold text-slate-950 transition-transform duration-300 hover:scale-105"
                >
                  Explore Platform
                  <ArrowRightIcon className="size-4" />
                </Link>
              ) : (
                <SignInButton mode="redirect">
                  <button className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(90deg,#f59e0b,#22c55e)] px-6 py-3.5 text-sm font-semibold text-slate-950 transition-transform duration-300 hover:scale-105">
                    Get Started
                    <ArrowRightIcon className="size-4" />
                  </button>
                </SignInButton>
              )}

              <Link
                to={isSignedIn ? "/ai-coach" : "/"}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/12"
              >
                See AI Experience
                <MonitorPlayIcon className="size-4" />
              </Link>
              {isSignedIn ? (
                <Link
                  to="/resume-checker"
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-300/18 bg-cyan-400/10 px-6 py-3.5 text-sm font-semibold text-cyan-50 transition-colors duration-300 hover:bg-cyan-400/16"
                >
                  Try Resume Checker
                  <ScanSearchIcon className="size-4" />
                </Link>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {deliveryPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5 text-sm leading-7 text-white/72 shadow-[0_16px_40px_rgba(0,0,0,0.16)] backdrop-blur-sm"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="service-stage rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] p-5 shadow-[0_40px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl">
              <div className="grid gap-4">
                {[
                  {
                    icon: VideoIcon,
                    label: "Live session rooms",
                    text: "Face-to-face collaboration with coding context always visible.",
                  },
                  {
                    icon: BotIcon,
                    label: "AI guidance",
                    text: "Mock interviews, live explanations, and follow-up coaching in one loop.",
                  },
                  {
                    icon: Code2Icon,
                    label: "Hands-on problem solving",
                    text: "Practice on real coding challenges instead of isolated theory.",
                  },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="service-float-card rounded-[26px] border border-white/10 bg-[#0f1720]/75 p-5"
                      style={{ animationDelay: `${index * 180}ms` }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(245,158,11,0.2),rgba(34,197,94,0.2),rgba(56,189,248,0.2))] text-white">
                          <Icon className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm uppercase tracking-[0.22em] text-white/45">
                            {item.label}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-white/72">{item.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-18">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-[#86efac]">What We Provide</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-bold text-white sm:text-5xl">
              A service stack designed around real interview readiness
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-white/62">
            Each service is meant to reduce friction between learning, practicing, receiving
            feedback, and performing under interview pressure.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <article
                key={service.title}
                className="service-card group rounded-[30px] border border-white/10 bg-white/[0.045] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div
                  className={`mb-6 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${service.accent} text-white shadow-[0_18px_36px_rgba(0,0,0,0.22)]`}
                >
                  <Icon className="size-6" />
                </div>
                <h3 className="text-2xl font-semibold text-white">{service.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/68">{service.description}</p>
                <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <p className="mt-5 text-xs uppercase tracking-[0.2em] text-white/38">
                  Talent IQ Service
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-20 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
          <p className="text-sm uppercase tracking-[0.28em] text-[#fcd34d]">About The Project</p>
          <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
            Talent IQ helps learners practice like the interview is already happening.
          </h2>
          <p className="mt-5 text-base leading-8 text-white/68">
            The project brings together collaboration, guided problem solving, live discussion, and
            AI-powered coaching so candidates can improve both how they code and how they explain
            their thinking. Instead of switching between disconnected tools, Talent IQ creates one
            environment for preparation, rehearsal, and review.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {[
            {
              title: "Why it matters",
              text: "Technical interviews test communication and reasoning as much as final answers. Our platform supports both.",
            },
            {
              title: "Who it serves",
              text: "Students, job seekers, mentors, and peers who want structured mock interviews and collaborative coding practice.",
            },
            {
              title: "How it feels",
              text: "Fast to enter, easier to stay focused in, and more realistic than practicing from static notes alone.",
            },
            {
              title: "Core value",
              text: "Turning preparation into repeated, feedback-rich practice so users build confidence through action.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[28px] border border-white/10 bg-[#121a23] p-6 shadow-[0_16px_48px_rgba(0,0,0,0.18)]"
            >
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/66">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ServicesPage;
