import { getAuth } from "@clerk/express";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

const getAuthContext = (req) => {
  try {
    return getAuth(req) || {};
  } catch {
    if (typeof req.auth === "function") return req.auth();
    return req.auth || {};
  }
};

const getDevHeader = (req, name) => {
  const value = req.headers?.[name];
  return typeof value === "string" && value.trim() ? value.trim() : "";
};

export const protectRoute = async (req, res, next) => {
  try {
    const auth = getAuthContext(req);
    const claims = auth.sessionClaims || {};
    const isDev = ENV.NODE_ENV !== "production";
    const devClerkId = isDev ? getDevHeader(req, "x-dev-clerk-user-id") : "";
    const clerkId = auth.userId || devClerkId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized - missing auth token" });
    }

    // find user in db by clerk ID
    let user = await User.findOne({ clerkId });

    const headerEmail = isDev ? getDevHeader(req, "x-dev-user-email") : "";
    const headerName = isDev ? getDevHeader(req, "x-dev-user-name") : "";
    const headerImage = isDev ? getDevHeader(req, "x-dev-user-image") : "";

    if (!user) {
      const email = claims.email || claims.email_address || headerEmail || `${clerkId}@local.user`;
      const firstName = claims.first_name || "";
      const lastName = claims.last_name || "";
      const fallbackName = `${firstName} ${lastName}`.trim();
      const name = claims.fullName || claims.name || headerName || fallbackName || "Talent IQ User";
      const profileImage = claims.image_url || claims.picture || headerImage || "";

      user = await User.create({
        clerkId,
        email,
        name,
        profileImage,
      });
    }

    const fallbackEmail = claims.email || claims.email_address || headerEmail || `${clerkId}@local.user`;
    const fallbackFirstName = claims.first_name || "";
    const fallbackLastName = claims.last_name || "";
    const fallbackName =
      claims.fullName ||
      claims.name ||
      headerName ||
      `${fallbackFirstName} ${fallbackLastName}`.trim() ||
      "Talent IQ User";
    const fallbackProfileImage = claims.image_url || claims.picture || headerImage || "";

    let shouldUpdateUser = false;

    if (!user.clerkId) {
      user.clerkId = clerkId;
      shouldUpdateUser = true;
    }

    if (!user.email) {
      user.email = fallbackEmail;
      shouldUpdateUser = true;
    }

    if (!user.name) {
      user.name = fallbackName;
      shouldUpdateUser = true;
    }

    if (!user.profileImage && fallbackProfileImage) {
      user.profileImage = fallbackProfileImage;
      shouldUpdateUser = true;
    }

    if (shouldUpdateUser) {
      await user.save();
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Error in protectRoute middleware", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
