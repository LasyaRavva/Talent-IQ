import { chatClient, ensureStreamUser, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";
import "../models/User.js";
import mongoose from "mongoose";
import crypto from "crypto";

const toIdString = (value) => value?.toString();

const getParticipantIds = (session) => {
  const ids = new Set((session.participants || []).map((id) => toIdString(id)));
  if (session.participant) ids.add(toIdString(session.participant));
  return ids;
};

const getMemberCount = (session) => 1 + getParticipantIds(session).size;

const createInviteCode = () => crypto.randomUUID().replace(/-/g, "").slice(0, 10);

const findSessionByIdOrInviteCode = async (idOrCode) => {
  const query = mongoose.Types.ObjectId.isValid(idOrCode)
    ? { $or: [{ _id: idOrCode }, { inviteCode: idOrCode }] }
    : { inviteCode: idOrCode };

  return Session.findOne(query);
};

export async function createSession(req, res) {
  try {
    const { problem, difficulty, maxMembers, callId: requestedCallId } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;
    const parsedMaxMembers = Number(maxMembers || 5);

    if (!problem || !difficulty) {
      return res.status(400).json({ message: "Problem and difficulty are required" });
    }

    if (Number.isNaN(parsedMaxMembers) || parsedMaxMembers < 2 || parsedMaxMembers > 5) {
      return res.status(400).json({ message: "maxMembers must be between 2 and 5" });
    }

    // generate a unique call id for stream video
    const callId =
      typeof requestedCallId === "string" && requestedCallId.trim()
        ? requestedCallId.trim()
        : `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    let inviteCode = createInviteCode();
    // Very low collision probability, but keep this deterministic and safe.
    while (await Session.exists({ inviteCode })) {
      inviteCode = createInviteCode();
    }

    // create session in db
    const session = await Session.create({
      problem,
      difficulty,
      host: userId,
      callId,
      inviteCode,
      maxMembers: parsedMaxMembers,
      sessionType: "cowork",
      participants: [],
    });

    await ensureStreamUser({
      id: clerkId,
      name: req.user?.name || "Talent IQ User",
      image: req.user?.profileImage || "",
    });

    // create stream video call
    await streamClient.video.call("default", callId).getOrCreate({
      data: {
        created_by_id: clerkId,
        custom: { problem, difficulty, sessionId: session._id.toString() },
      },
    });

    // chat messaging
    const channel = chatClient.channel("messaging", callId, {
      name: `${problem} Session`,
      created_by_id: clerkId,
      members: [clerkId],
    });

    await channel.create();

    const serializedSession = session.toObject({ versionKey: false });
    const sessionId = session._id.toString();

    res.status(201).json({
      session: {
        ...serializedSession,
        _id: sessionId,
        id: sessionId,
      },
      sessionId,
      id: sessionId,
    });
  } catch (error) {
    console.log("Error in createSession controller:", error);

    const statusCode = error?.statusCode || error?.response?.status || 500;
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Internal Server Error";

    res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({ message });
  }
}

export async function getActiveSessions(req, res) {
  try {
    const userId = req.user._id;

    const sessions = await Session.find({
      status: "active",
      $or: [{ host: userId }, { participant: userId }, { participants: userId }],
    })
      .populate("host", "name profileImage email clerkId")
      .populate("participants", "name profileImage email clerkId")
      .populate("participant", "name profileImage email clerkId")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getActiveSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyRecentSessions(req, res) {
  try {
    const userId = req.user._id;

    // get sessions where user is either host or participant
    const sessions = await Session.find({
      status: "completed",
      $or: [{ host: userId }, { participant: userId }, { participants: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getMyRecentSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getSessionById(req, res) {
  try {
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { inviteCode: id }] }
      : { inviteCode: id };

    const session = await Session.findOne(query)
      .populate("host", "name email profileImage clerkId")
      .populate("participants", "name email profileImage clerkId")
      .populate("participant", "name email profileImage clerkId");

    if (!session) return res.status(404).json({ message: "Session not found" });

    res.status(200).json({ session });
  } catch (error) {
    console.log("Error in getSessionById controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function joinSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    const session = await findSessionByIdOrInviteCode(id);

    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status !== "active") {
      return res.status(400).json({ message: "Cannot join a completed session" });
    }

    if (session.host.toString() === userId.toString()) {
      return res.status(200).json({ session, message: "Host already in session" });
    }

    const participantIds = getParticipantIds(session);
    const userIdString = userId.toString();

    if (participantIds.has(userIdString)) {
      return res.status(200).json({ session, message: "Already joined" });
    }

    const currentMembers = getMemberCount(session);
    if (currentMembers >= session.maxMembers) {
      return res.status(409).json({ message: "Session is full" });
    }

    session.participants = [...(session.participants || []), userId];
    if (!session.participant) session.participant = userId;
    await session.save();

    await ensureStreamUser({
      id: clerkId,
      name: req.user?.name || "Talent IQ User",
      image: req.user?.profileImage || "",
    });

    const channel = chatClient.channel("messaging", session.callId);
    await channel.addMembers([clerkId]);

    res.status(200).json({ session });
  } catch (error) {
    console.log("Error in joinSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function leaveSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    const session = await findSessionByIdOrInviteCode(id);

    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.host.toString() === userId.toString()) {
      return res.status(403).json({ message: "The host must end the session instead of leaving it" });
    }

    const userIdString = userId.toString();
    const remainingParticipants = (session.participants || []).filter(
      (participantId) => participantId.toString() !== userIdString
    );

    const wasInParticipants = remainingParticipants.length !== (session.participants || []).length;
    const wasLegacyParticipant =
      session.participant && session.participant.toString() === userIdString;

    if (!wasInParticipants && !wasLegacyParticipant) {
      return res.status(200).json({ session, message: "User is not part of this session" });
    }

    session.participants = remainingParticipants;
    session.participant = remainingParticipants[0] || null;
    await session.save();

    try {
      const channel = chatClient.channel("messaging", session.callId);
      await channel.removeMembers([clerkId]);
    } catch (error) {
      console.warn("Chat member cleanup warning in leaveSession:", error?.message || error);
    }

    res.status(200).json({
      session,
      message: "Left session successfully",
    });
  } catch (error) {
    console.log("Error in leaveSession controller:", error.message);
    res.status(500).json({ message: error?.message || "Internal Server Error" });
  }
}

export async function endSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await findSessionByIdOrInviteCode(id);

    if (!session) return res.status(404).json({ message: "Session not found" });

    // check if user is the host
    if (session.host.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the host can end the session" });
    }

    // check if session is already completed
    if (session.status === "completed") {
      return res.status(400).json({ message: "Session is already completed" });
    }

    session.status = "completed";
    await session.save();

    const cleanupResults = await Promise.allSettled([
      (async () => {
        if (!session.callId) return;
        const call = streamClient.video.call("default", session.callId);
        await call.delete({ hard: true });
      })(),
      (async () => {
        if (!session.callId) return;
        const channel = chatClient.channel("messaging", session.callId);
        await channel.delete();
      })(),
    ]);

    const cleanupErrors = cleanupResults
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason?.message || "Unknown Stream cleanup error");

    if (cleanupErrors.length > 0) {
      console.warn("Stream cleanup warnings in endSession:", cleanupErrors);
    }

    res.status(200).json({
      session,
      message: cleanupErrors.length > 0 ? "Session ended with cleanup warnings" : "Session ended successfully",
    });
  } catch (error) {
    console.log("Error in endSession controller:", error.message);
    res.status(500).json({ message: error?.message || "Internal Server Error" });
  }
}
