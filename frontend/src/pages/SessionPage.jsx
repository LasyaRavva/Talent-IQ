import { useUser } from "@clerk/clerk-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { StreamCall, StreamVideo } from "@stream-io/video-react-sdk";
import { Loader2Icon, LogOutIcon, PhoneOffIcon } from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import toast from "react-hot-toast";
import CodeEditorPanel from "../components/CodeEditorPanel";
import Navbar from "../components/Navbar";
import OutputPanel from "../components/OutputPanel";
import VideoCallUI from "../components/VideoCallUI";
import { PROBLEMS } from "../data/problems";
import { executeCode } from "../lib/piston";
import { getDifficultyBadgeClass, getSessionMemberStats, getSessionParticipants } from "../lib/utils";
import { useEndSession, useJoinSession, useLeaveSession, useSessionById } from "../hooks/useSessions";
import useStreamClient from "../hooks/useStreamClient";

function SessionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { user } = useUser();
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const attemptedJoinRef = useRef(null);
  const stateLiveSession = location.state?.liveSession;
  const storedLiveSession =
    !id && typeof window !== "undefined"
      ? (() => {
          try {
            const value = sessionStorage.getItem("liveSession");
            return value ? JSON.parse(value) : null;
          } catch {
            return null;
          }
        })()
      : null;
  const liveSession = stateLiveSession || storedLiveSession;

  const { data: sessionData, isLoading: loadingSession, refetch } = useSessionById(id);

  const joinSessionMutation = useJoinSession();
  const endSessionMutation = useEndSession();
  const leaveSessionMutation = useLeaveSession();

  const session = sessionData?.session || liveSession;
  const isHost = session?.host?.clerkId === user?.id;
  const participants = getSessionParticipants(session);
  const isParticipant =
    session?.participant?.clerkId === user?.id ||
    participants.some((member) => member?.clerkId === user?.id);
  const { currentMembers, maxMembers } = getSessionMemberStats(session);
  const roomCode = session?.inviteCode || id || "";

  const { call, channel, chatClient, isInitializingCall, streamClient, callError } = useStreamClient(
    session,
    loadingSession,
    isHost,
    isParticipant
  );

  const problemData = session?.problem
    ? Object.values(PROBLEMS).find((problem) => problem.title === session.problem)
    : null;

  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState(problemData?.starterCode?.[selectedLanguage] || "");

  useEffect(() => {
    if (!id) return;
    if (!session || !user || loadingSession) return;
    if (isHost || isParticipant) return;
    if (joinSessionMutation.isPending) return;
    if (attemptedJoinRef.current === id) return;

    attemptedJoinRef.current = id;
    joinSessionMutation.mutate(id, {
      onSuccess: () => {
        refetch();
      },
      onError: () => {
        attemptedJoinRef.current = null;
      },
    });
  }, [session, user, loadingSession, isHost, isParticipant, id, refetch, joinSessionMutation]);

  useEffect(() => {
    attemptedJoinRef.current = null;
  }, [id, user?.id]);

  useEffect(() => {
    if (!id) return;
    if (!session || loadingSession) return;

    if (session.status === "completed") navigate("/dashboard");
  }, [session, loadingSession, navigate, id]);

  useEffect(() => {
    if (problemData?.starterCode?.[selectedLanguage]) {
      setCode(problemData.starterCode[selectedLanguage]);
    }
  }, [problemData, selectedLanguage]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    const starterCode = problemData?.starterCode?.[newLang] || "";
    setCode(starterCode);
    setOutput(null);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput(null);

    const result = await executeCode(selectedLanguage, code);
    setOutput(result);
    setIsRunning(false);
  };

  const handleEndSession = () => {
    const sessionId = id || session?._id || session?.id || session?.inviteCode;
    if (!sessionId) {
      toast.error("This session is missing its id. Please create a fresh session and try again.");
      sessionStorage.removeItem("liveSession");
      navigate("/dashboard");
      return;
    }

    if (confirm("Are you sure you want to end this session? All participants will be notified.")) {
      endSessionMutation.mutate(sessionId, {
        onSuccess: () => {
          sessionStorage.removeItem("liveSession");
          navigate("/dashboard");
        },
      });
    }
  };

  const handleLeaveSession = () => {
    const sessionId = id || session?._id || session?.id || session?.inviteCode;
    if (!sessionId) {
      toast.error("This session is missing its id. Please rejoin from the dashboard.");
      sessionStorage.removeItem("liveSession");
      navigate("/dashboard");
      return;
    }

    if (confirm("Are you sure you want to leave this session?")) {
      leaveSessionMutation.mutate(sessionId, {
        onSuccess: () => {
          sessionStorage.removeItem("liveSession");
          navigate("/dashboard");
        },
      });
    }
  };

  const handleCopyRoomCode = async () => {
    if (!roomCode) {
      toast.error("Room code is not available");
      return;
    }

    try {
      await navigator.clipboard.writeText(roomCode);
      toast.success("Room code copied");
    } catch {
      toast.error("Unable to copy room code");
    }
  };

  useEffect(() => {
    if (!id) return;
    sessionStorage.removeItem("liveSession");
  }, [id]);

  useEffect(() => {
    if (id || !liveSession) return;

    sessionStorage.setItem("liveSession", JSON.stringify(liveSession));
  }, [id, liveSession]);

  return (
    <div className="h-screen bg-base-100 flex flex-col">
      <Navbar />

      <div className="flex-1">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={50} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={50} minSize={20}>
                <div className="h-full overflow-y-auto bg-base-200">
                  <div className="p-6 bg-base-100 border-b border-base-300">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h1 className="text-3xl font-bold text-base-content">
                          {session?.problem || "Session"}
                        </h1>
                        {problemData?.category && (
                          <p className="text-base-content/60 mt-1">{problemData.category}</p>
                        )}
                        <p className="text-base-content/60 mt-2">
                          Host: {session?.host?.name || "Loading..."} •{" "}
                          {currentMembers}/{maxMembers} participants
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`badge badge-lg ${getDifficultyBadgeClass(
                            session?.difficulty
                          )}`}
                        >
                          {session?.difficulty
                            ? session.difficulty.slice(0, 1).toUpperCase() +
                              session.difficulty.slice(1)
                            : "Easy"}
                        </span>
                        {isHost && session?.status === "active" && (
                          <button
                            onClick={handleEndSession}
                            disabled={endSessionMutation.isPending}
                            className="btn btn-error btn-sm gap-2"
                          >
                            {endSessionMutation.isPending ? (
                              <Loader2Icon className="w-4 h-4 animate-spin" />
                            ) : (
                              <LogOutIcon className="w-4 h-4" />
                            )}
                            End Session
                          </button>
                        )}
                        {!isHost && isParticipant && session?.status === "active" && (
                          <button
                            onClick={handleLeaveSession}
                            disabled={leaveSessionMutation.isPending}
                            className="btn btn-outline btn-sm gap-2"
                          >
                            {leaveSessionMutation.isPending ? (
                              <Loader2Icon className="w-4 h-4 animate-spin" />
                            ) : (
                              <LogOutIcon className="w-4 h-4" />
                            )}
                            Leave Session
                          </button>
                        )}
                        {session?.status === "completed" && (
                          <span className="badge badge-ghost badge-lg">Completed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {roomCode && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h2 className="text-xl font-bold text-base-content">Room Code</h2>
                            <p className="text-base-content/70 mt-1">
                              Ask another signed-in user to enter this code from the dashboard.
                            </p>
                            <p className="text-sm text-base-content/70 mt-2">
                              Code: <code>{roomCode}</code>
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleCopyRoomCode}
                            className="btn btn-primary btn-sm"
                          >
                            Copy Room Code
                          </button>
                        </div>
                      </div>
                    )}

                    {problemData?.description && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <h2 className="text-xl font-bold mb-4 text-base-content">Description</h2>
                        <div className="space-y-3 text-base leading-relaxed">
                          <p className="text-base-content/90">{problemData.description.text}</p>
                          {problemData.description.notes?.map((note, idx) => (
                            <p key={idx} className="text-base-content/90">
                              {note}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {problemData?.examples?.length > 0 && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <h2 className="text-xl font-bold mb-4 text-base-content">Examples</h2>
                        <div className="space-y-4">
                          {problemData.examples.map((example, idx) => (
                            <div key={idx}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="badge badge-sm">{idx + 1}</span>
                                <p className="font-semibold text-base-content">Example {idx + 1}</p>
                              </div>
                              <div className="bg-base-200 rounded-lg p-4 font-mono text-sm space-y-1.5">
                                <div className="flex gap-2">
                                  <span className="text-primary font-bold min-w-[70px]">Input:</span>
                                  <span>{example.input}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-secondary font-bold min-w-[70px]">Output:</span>
                                  <span>{example.output}</span>
                                </div>
                                {example.explanation && (
                                  <div className="pt-2 border-t border-base-300 mt-2">
                                    <span className="text-base-content/60 font-sans text-xs">
                                      <span className="font-semibold">Explanation:</span>{" "}
                                      {example.explanation}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {problemData?.constraints?.length > 0 && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <h2 className="text-xl font-bold mb-4 text-base-content">Constraints</h2>
                        <ul className="space-y-2 text-base-content/90">
                          {problemData.constraints.map((constraint, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-primary">•</span>
                              <code className="text-sm">{constraint}</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

              <Panel defaultSize={50} minSize={20}>
                <PanelGroup direction="vertical">
                  <Panel defaultSize={70} minSize={30}>
                    <CodeEditorPanel
                      selectedLanguage={selectedLanguage}
                      code={code}
                      isRunning={isRunning}
                      onLanguageChange={handleLanguageChange}
                      onCodeChange={(value) => setCode(value)}
                      onRunCode={handleRunCode}
                    />
                  </Panel>

                  <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

                  <Panel defaultSize={30} minSize={15}>
                    <OutputPanel output={output} />
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-2 bg-base-300 hover:bg-primary transition-colors cursor-col-resize" />

          <Panel defaultSize={50} minSize={30}>
            <div className="h-full bg-base-200 p-4 overflow-auto">
              {isInitializingCall ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
                    <p className="text-lg">Opening video session...</p>
                  </div>
                </div>
              ) : !streamClient || !call ? (
                <div className="h-full flex items-center justify-center">
                  <div className="card bg-base-100 shadow-xl max-w-md">
                    <div className="card-body items-center text-center">
                      <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mb-4">
                        <PhoneOffIcon className="w-12 h-12 text-error" />
                      </div>
                      <h2 className="card-title text-2xl">Connection Failed</h2>
                      <p className="text-base-content/70">
                        {callError || "Unable to connect to the video call"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <StreamVideo client={streamClient}>
                    <StreamCall call={call}>
                      <VideoCallUI
                        chatClient={chatClient}
                        channel={channel}
                        onLeave={isHost ? undefined : handleLeaveSession}
                      />
                    </StreamCall>
                  </StreamVideo>
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default SessionPage;
