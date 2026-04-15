import { useNavigate } from "react-router";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useActiveSessions, useCreateSession, useMyRecentSessions } from "../hooks/useSessions";

import Navbar from "../components/Navbar";
import WelcomeSection from "../components/WelcomeSection";
import StatsCards from "../components/StatsCards";
import ActiveSessions from "../components/ActiveSessions";
import RecentSessions from "../components/RecentSessions";
import CreateSessionModal from "../components/CreateSessionModal";

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomConfig, setRoomConfig] = useState({ problem: "", difficulty: "" });
  const [joinCode, setJoinCode] = useState("");

  const createSessionMutation = useCreateSession();

  const { data: activeSessionsData, isLoading: loadingActiveSessions } = useActiveSessions();
  const { data: recentSessionsData, isLoading: loadingRecentSessions } = useMyRecentSessions();

  const handleCreateRoom = async () => {
    if (!roomConfig.problem || !roomConfig.difficulty) return;

    try {
      const clientCallId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const createdSessionResponse = await createSessionMutation.mutateAsync({
        problem: roomConfig.problem,
        difficulty: roomConfig.difficulty.toLowerCase(),
        callId: clientCallId,
      });

      const createdSession = createdSessionResponse?.session || {};
      const sessionId = createdSessionResponse?.sessionId || createdSession?._id || createdSession?.id || null;
      const sessionRouteId = createdSession?.inviteCode || sessionId;

      const liveSession = {
        _id: sessionId,
        id: sessionId,
        problem: roomConfig.problem,
        difficulty: roomConfig.difficulty.toLowerCase(),
        callId: createdSession?.callId || clientCallId,
        inviteCode: createdSession?.inviteCode || null,
        status: createdSession?.status || "active",
        host: {
          clerkId: user?.id,
          name: user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || "Host",
          profileImage: user?.imageUrl || "",
        },
        participants: createdSession?.participants || [],
        maxMembers: createdSession?.maxMembers || 5,
      };

      sessionStorage.setItem("liveSession", JSON.stringify(liveSession));
      setShowCreateModal(false);
      navigate(sessionRouteId ? `/session/${sessionRouteId}` : "/session/live", {
        state: sessionRouteId
          ? undefined
          : {
              liveSession,
            },
      });
    } catch {
      // The mutation hook already shows the error toast.
    }
  };

  const handleJoinByCode = () => {
    const normalizedCode = joinCode.trim();

    if (!normalizedCode) {
      toast.error("Enter a room code to join");
      return;
    }

    navigate(`/session/${normalizedCode}`);
  };

  const activeSessions = activeSessionsData?.sessions || [];
  const recentSessions = recentSessionsData?.sessions || [];

  const isUserInSession = (session) => {
    if (!user?.id) return false;

    const participants = Array.isArray(session.participants) ? session.participants : [];
    const inParticipants = participants.some((member) => member?.clerkId === user.id);

    return session.host?.clerkId === user.id || session.participant?.clerkId === user.id || inParticipants;
  };

  return (
    <>
      <div className="min-h-screen bg-base-300">
        <Navbar />
        <WelcomeSection
          onCreateSession={() => setShowCreateModal(true)}
          joinCode={joinCode}
          onJoinCodeChange={setJoinCode}
          onJoinByCode={handleJoinByCode}
        />

        <div className="container mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StatsCards
              activeSessionsCount={activeSessions.length}
              recentSessionsCount={recentSessions.length}
            />
            <ActiveSessions
              sessions={activeSessions}
              isLoading={loadingActiveSessions}
              isUserInSession={isUserInSession}
            />
          </div>

          <RecentSessions sessions={recentSessions} isLoading={loadingRecentSessions} />
        </div>
      </div>

      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        roomConfig={roomConfig}
        setRoomConfig={setRoomConfig}
        onCreateRoom={handleCreateRoom}
        isCreating={createSessionMutation.isPending}
      />
    </>
  );
}

export default DashboardPage;
