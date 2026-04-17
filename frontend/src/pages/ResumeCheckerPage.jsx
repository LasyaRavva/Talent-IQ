import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileUpIcon,
  FileSearchIcon,
  Loader2Icon,
  ScanSearchIcon,
  ShieldAlertIcon,
  SparklesIcon,
  TargetIcon,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { aiApi } from "../api/ai";

const starterJob = `Frontend Developer

We are hiring a frontend developer with experience in React, modern JavaScript, reusable component systems, API integration, performance optimization, and collaboration with designers and backend engineers.

Preferred:
- TypeScript
- Testing experience
- Metrics-driven impact
- Experience improving accessibility and user experience`;

const extractScore = (text) => {
  const match = text.match(/match score:\s*([0-9]{1,3})/i) || text.match(/\b([0-9]{1,3})\s*\/\s*100\b/);
  if (!match) return null;
  const score = Number(match[1]);
  if (Number.isNaN(score)) return null;
  return Math.max(0, Math.min(100, score));
};

const getProviderTone = (provider) => {
  const normalized = (provider || "").toLowerCase();
  if (normalized === "ollama") {
    return "border-emerald-400/30 bg-emerald-400/12 text-emerald-200";
  }

  if (normalized === "scanning" || normalized === "connecting") {
    return "border-cyan-300/30 bg-cyan-300/12 text-cyan-100";
  }

  if (normalized === "local") {
    return "border-amber-300/30 bg-amber-300/12 text-amber-100";
  }

  return "border-white/12 bg-white/6 text-white/78";
};

const wrapPdfLine = (line, maxChars = 88) => {
  if (!line) return [""];
  const words = line.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
      continue;
    }

    current = next;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [line.slice(0, maxChars)];
};

const escapePdfText = (value = "") =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, " ");

const buildFeedbackPdfBlob = ({ analysis, score, targetRole, resumeName, sectionScores }) => {
  const headerLines = [
    "Talent IQ Resume Feedback",
    targetRole ? `Target Role: ${targetRole}` : "Target Role: -",
    resumeName ? `Resume File: ${resumeName}` : "Resume File: -",
    `Match Score: ${score ?? "--"}/100`,
  ];

  const scoreLines = sectionScores
    ? [
        `Skills Match: ${sectionScores.skills ?? "--"}/100`,
        `Experience Signals: ${sectionScores.experience ?? "--"}/100`,
        `Keyword Coverage: ${sectionScores.keywordCoverage ?? "--"}/100`,
      ]
    : [];

  const bodyLines = analysis
    .split(/\r?\n/)
    .flatMap((line) => wrapPdfLine(line.trim()))
    .filter((line, index, array) => line || (index > 0 && array[index - 1] !== ""));

  const allLines = [...headerLines, "", ...scoreLines, ...(scoreLines.length ? [""] : []), ...bodyLines];
  const linesPerPage = 44;
  const pages = [];

  for (let i = 0; i < allLines.length; i += linesPerPage) {
    pages.push(allLines.slice(i, i + linesPerPage));
  }

  const objects = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds = [];
  const contentIds = [];

  for (const pageLines of pages) {
    let y = 780;
    const commands = ["BT", "/F1 11 Tf", "14 TL"];

    for (const line of pageLines) {
      commands.push(`1 0 0 1 48 ${y} Tm (${escapePdfText(line)}) Tj`);
      y -= 14;
    }

    commands.push("ET");
    const stream = commands.join("\n");
    const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    contentIds.push(contentId);
    pageIds.push(addObject(""));
  }

  const pagesId = addObject("");

  pageIds.forEach((pageId, index) => {
    objects[pageId - 1] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`;
  });

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
};

function ResumeCheckerPage() {
  const [targetRole, setTargetRole] = useState("Frontend Developer");
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState(starterJob);
  const [analysis, setAnalysis] = useState("");
  const [liveScore, setLiveScore] = useState(null);
  const [sectionScores, setSectionScores] = useState(null);
  const [isFeedbackReady, setIsFeedbackReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Upload a resume file from local storage, then paste the job description to get streamed feedback.");
  const [provider, setProvider] = useState("-");
  const [model, setModel] = useState("-");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const abortControllerRef = useRef(null);

  const score = useMemo(() => liveScore ?? extractScore(analysis), [analysis, liveScore]);
  const canAnalyze = Boolean(resumeFile) && jobDescription.trim().length > 80 && !isAnalyzing;
  const canDownloadFeedback = Boolean(analysis.trim()) && isFeedbackReady;

  const handleResumeSelect = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setResumeFile(null);
      return;
    }

    const isDocx =
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.toLowerCase().endsWith(".docx");

    if (!isDocx) {
      toast.error("Upload a DOCX resume.");
      event.target.value = "";
      setResumeFile(null);
      return;
    }

    setResumeFile(file);
    setStatusMessage("DOCX selected. This is the supported format for reliable scanning.");
  };

  const downloadFeedbackPdf = () => {
    if (!canDownloadFeedback) return;

    const blob = buildFeedbackPdfBlob({
      analysis,
      score,
      targetRole,
      resumeName: resumeFile?.name || "",
      sectionScores,
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `resume-feedback-${(targetRole || "report").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const startAnalysis = async () => {
    if (!canAnalyze) {
      toast.error("Upload a resume file and add the job description before running analysis.");
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsAnalyzing(true);
    setAnalysis("");
    setLiveScore(null);
    setSectionScores(null);
    setIsFeedbackReady(false);
    setProvider("connecting");
    setModel("-");
    setStatusMessage("Uploading resume and preparing scan...");

    try {
      let finalReply = "";

      await aiApi.askResumeCheckStream({
        resumeFile,
        jobDescription,
        targetRole,
        signal: abortController.signal,
        onEvent: (event) => {
          if (event.type === "status") {
            if (provider === "connecting") {
              setProvider("scanning");
            }
            setStatusMessage(event.message || "Preparing analysis...");
            return;
          }

          if (event.type === "preview") {
            setAnalysis(event.content || "");
            setLiveScore(typeof event.score === "number" ? event.score : null);
            setSectionScores(event.sectionScores || null);
            setIsFeedbackReady(false);
            setStatusMessage("Quick preview ready. Waiting for full Ollama feedback...");
            return;
          }

          if (event.type === "meta") {
            setProvider(event.provider || "unknown");
            setModel(event.model || "unknown");
            setStatusMessage(`Connected to ${event.provider || "AI provider"}. Streaming feedback now...`);
            return;
          }

          if (event.type === "delta") {
            finalReply += event.content || "";
            setAnalysis(finalReply);
            setIsFeedbackReady(false);
            setStatusMessage("Streaming resume feedback...");
            return;
          }

          if (event.type === "done") {
            finalReply = event.reply || finalReply;
            setProvider(event.provider || "unknown");
            setModel(event.model || "unknown");
            setAnalysis(finalReply);
            setLiveScore(extractScore(finalReply));
            setIsFeedbackReady(true);
            setStatusMessage("Analysis complete.");
          }
        },
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        setIsFeedbackReady(false);
        setProvider("error");
        setStatusMessage(error.message || "Failed to analyze resume.");
        toast.error(error.message || "Failed to analyze resume.");
      }
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      setIsAnalyzing(false);
    }
  };

  const stopAnalysis = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsAnalyzing(false);
    setIsFeedbackReady(false);
    setStatusMessage("Analysis stopped.");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_26%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.12),transparent_22%),#0d1117] text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(59,130,246,0.16),rgba(16,185,129,0.12),rgba(255,255,255,0.04))] p-7 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/75">Resume Checker</p>
              <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
                Real-time resume feedback that stays evidence-first
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
                Compare your resume against a target role and job description. The checker is designed to be practical and conservative:
                it flags missing evidence, avoids inventing qualifications, and gives rewrite ideas you can verify before applying.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">Provider</p>
                <p className="mt-2 text-sm font-semibold text-white">{provider}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">Model</p>
                <p className="mt-2 text-sm font-semibold text-white">{model}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">Match Score</p>
                <p className="mt-2 text-sm font-semibold text-white">{score ?? "--"}{score !== null ? "/100" : ""}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2Icon className="size-4" />
                What it does well
              </div>
              <p className="mt-2 leading-7 text-emerald-50/82">
                Compares resume evidence to job requirements and highlights strengths, gaps, and rewrite opportunities.
              </p>
            </div>
            <div className="rounded-[24px] border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldAlertIcon className="size-4" />
                Accuracy guardrail
              </div>
              <p className="mt-2 leading-7 text-amber-50/82">
                It should not invent projects, metrics, tools, or experience. If the resume does not prove something, the result should say so.
              </p>
            </div>
            <div className="rounded-[24px] border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-50">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangleIcon className="size-4" />
                Important limit
              </div>
              <p className="mt-2 leading-7 text-cyan-50/82">
                This is advisory feedback, not a hiring decision. Verify every suggested rewrite before using it in an application.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-6">
            <div className="rounded-[30px] border border-white/10 bg-[#111723] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-cyan-400/14 text-cyan-200">
                  <TargetIcon className="size-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Input</h2>
                  <p className="text-sm text-white/60">Upload your DOCX resume and we will scan it directly for evidence-based feedback.</p>
                </div>
              </div>

              <label className="mb-5 block">
                <span className="mb-2 block text-sm font-medium text-white/85">Target Role</span>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(event) => setTargetRole(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0a0f17] px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                  placeholder="Frontend Developer, Full Stack Engineer, Data Analyst..."
                />
              </label>

              <label className="mb-5 block">
                <span className="mb-2 block text-sm font-medium text-white/85">Resume File</span>
                <div className="rounded-[24px] border border-dashed border-white/15 bg-[#0a0f17] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-white/6 text-cyan-200">
                        <FileUpIcon className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Upload DOCX</p>
                        <p className="text-xs text-white/55">DOCX only. This keeps the scan reliable and avoids misleading PDF extraction issues.</p>
                      </div>
                    </div>

                    <label className="inline-flex cursor-pointer items-center rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                      Choose File
                      <input
                        type="file"
                        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleResumeSelect}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/72">
                    {resumeFile
                      ? `${resumeFile.name} | ${(resumeFile.size / 1024 / 1024).toFixed(2)} MB`
                      : "No resume selected yet."}
                  </div>
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/85">Job Description</span>
                <textarea
                  rows={14}
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  className="w-full rounded-[24px] border border-white/10 bg-[#0a0f17] px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-cyan-300"
                  placeholder="Paste the target job description here..."
                />
              </label>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={startAnalysis}
                  disabled={!canAnalyze}
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(90deg,#38bdf8,#10b981)] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2Icon className="size-4 animate-spin" /> : <ScanSearchIcon className="size-4" />}
                  {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
                </button>

                {isAnalyzing ? (
                  <button
                    type="button"
                    onClick={stopAnalysis}
                    className="rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Stop
                  </button>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                <div className={`rounded-full border px-4 py-2 font-semibold ${getProviderTone(provider)}`}>
                  {provider === "connecting"
                    ? "Live AI: connecting..."
                    : provider === "scanning"
                      ? "Live AI: scanning resume..."
                    : provider !== "-"
                      ? `Live AI: ${provider}${model !== "-" ? ` | ${model}` : ""}`
                      : "Live AI: waiting to connect"}
                </div>
                <p className="text-white/60">{statusMessage}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-white/10 bg-[#0f1520] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-200">
                  <FileSearchIcon className="size-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Live Review</h2>
                  <p className="text-sm text-white/60">The response streams in real time and stays grounded in the uploaded resume content.</p>
                </div>
              </div>

            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Review Checklist</p>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-white/72">
                  <li>Resume must be uploaded as DOCX</li>
                  <li>Evidence-backed strengths only</li>
                  <li>Missing requirements called out clearly</li>
                  <li>No fake metrics or invented tools</li>
                  <li>Representation and rewrite suggestions tailored to the target role</li>
                </ul>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Best Use</p>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-white/72">
                  <li>Check alignment before applying</li>
                  <li>Find missing keywords and weak proof</li>
                  <li>Rewrite vague bullets into sharper ones</li>
                  <li>Compare multiple versions of the same resume</li>
                </ul>
              </div>
            </div>

            <div className="rounded-[26px] border border-cyan-400/12 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(6,10,18,0.98))] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-white/66">
                  <SparklesIcon className="size-4 text-cyan-200" />
                  Structured output should include Match Score, Strong Matches, Gaps, Risk Flags, Rewrite Suggestions, and Verdict.
                </div>
                {score !== null ? (
                  <div className="rounded-full border border-emerald-400/30 bg-emerald-400/12 px-3 py-1 text-sm font-semibold text-emerald-200">
                    Score {score}/100
                  </div>
                ) : null}
              </div>

              {sectionScores ? (
                <div className="mb-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Skills Match</p>
                    <p className="mt-2 text-lg font-semibold text-white">{sectionScores.skills ?? "--"}/100</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Experience Signals</p>
                    <p className="mt-2 text-lg font-semibold text-white">{sectionScores.experience ?? "--"}/100</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Keyword Coverage</p>
                    <p className="mt-2 text-lg font-semibold text-white">{sectionScores.keywordCoverage ?? "--"}/100</p>
                  </div>
                </div>
              ) : null}

              <div className="min-h-[620px] whitespace-pre-wrap rounded-[22px] border border-white/8 bg-black/20 p-5 text-sm leading-7 text-slate-100">
                {analysis || "Run the analysis to see a live, evidence-based review of the resume against the job description."}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={downloadFeedbackPdf}
                  disabled={!canDownloadFeedback}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <DownloadIcon className="size-4" />
                  Download Feedback PDF
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ResumeCheckerPage;
