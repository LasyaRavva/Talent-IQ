import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  askAiCoach,
  createSimliAvatarSession,
  streamAiCoach,
  transcribeAudio,
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/coach", protectRoute, askAiCoach);
router.post("/coach/stream", protectRoute, streamAiCoach);
router.post("/transcribe", protectRoute, transcribeAudio);
router.post("/avatar/session", protectRoute, createSimliAvatarSession);

export default router;
