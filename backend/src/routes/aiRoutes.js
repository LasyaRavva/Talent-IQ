import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { askAiCoach, streamAiCoach } from "../controllers/aiController.js";

const router = express.Router();

router.post("/coach", protectRoute, askAiCoach);
router.post("/coach/stream", protectRoute, streamAiCoach);

export default router;
