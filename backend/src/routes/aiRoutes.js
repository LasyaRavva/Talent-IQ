import express from "express";
import multer from "multer";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  askAiCoach,
  createSimliAvatarSession,
  streamResumeCheck,
  streamAiCoach,
  transcribeAudio,
} from "../controllers/aiController.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const name = (file?.originalname || "").toLowerCase();
    const mime = file?.mimetype || "";
    const isDocx =
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || name.endsWith(".docx");

    if (isDocx) {
      cb(null, true);
      return;
    }

    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file?.fieldname || "resume"));
  },
});

const resumeUploadMiddleware = (req, res, next) => {
  upload.single("resume")(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "Resume file is too large. Upload a DOCX up to 5 MB." });
        }

        return res.status(400).json({ message: "Upload a valid DOCX resume file." });
      }

      return res.status(400).json({ message: error.message || "Failed to upload resume file." });
    }

    next();
  });
};

router.post("/coach", protectRoute, askAiCoach);
router.post("/coach/stream", protectRoute, streamAiCoach);
router.post("/resume-check/stream", protectRoute, resumeUploadMiddleware, streamResumeCheck);
router.post("/transcribe", protectRoute, transcribeAudio);
router.post("/avatar/session", protectRoute, createSimliAvatarSession);

export default router;
