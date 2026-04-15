import { generateAiReply, streamAiReply } from "../lib/aiClient.js";

export async function askAiCoach(req, res) {
  try {
    const { messages, mode = "coach", topic = "", difficulty = "" } = req.body;

    const result = await generateAiReply({
      mode,
      topic,
      difficulty,
      messages,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in askAiCoach controller:", error.message);
    return res.status(400).json({ message: error.message || "Failed to get AI response" });
  }
}

export async function streamAiCoach(req, res) {
  try {
    const { messages, mode = "coach", topic = "", difficulty = "" } = req.body;

    res.status(200);
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    for await (const event of streamAiReply({
      mode,
      topic,
      difficulty,
      messages,
    })) {
      res.write(`${JSON.stringify(event)}\n`);
    }

    return res.end();
  } catch (error) {
    console.error("Error in streamAiCoach controller:", error.message);

    if (!res.headersSent) {
      return res.status(400).json({ message: error.message || "Failed to stream AI response" });
    }

    res.write(`${JSON.stringify({ type: "error", message: error.message || "Failed to stream AI response" })}\n`);
    return res.end();
  }
}
