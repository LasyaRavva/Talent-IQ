import { chatClient, ensureStreamUser } from "../lib/stream.js";
import { ENV } from "../lib/env.js";

const getAuthContext = (req) => {
  if (typeof req.auth === "function") return req.auth();
  return req.auth || {};
};

export async function getStreamToken(req, res) {
  try {
    if (!ENV.STREAM_API_KEY || !ENV.STREAM_API_SECRET) {
      return res.status(500).json({
        message: "Stream server configuration is missing. Check backend/.env.",
      });
    }

    const auth = getAuthContext(req);

    // use clerkId for Stream (not mongodb _id)=> it should match the id we have in the stream dashboard
    const clerkUserId = req.user?.clerkId || auth.userId;

    if (!clerkUserId) {
      return res.status(400).json({ message: "Missing Clerk user id for Stream token" });
    }

    await ensureStreamUser({
      id: clerkUserId,
      name: req.user?.name || "Talent IQ User",
      image: req.user?.profileImage || "",
    });

    const token = chatClient.createToken(clerkUserId);

    if (!token || typeof token !== "string") {
      return res.status(500).json({ message: "Failed to create Stream token" });
    }

    res.status(200).json({
      token,
      userId: clerkUserId,
      userName: req.user?.name || "Talent IQ User",
      userImage: req.user?.profileImage || "",
    });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({
      message: error?.message || "Unable to generate Stream token",
    });
  }
}
