const JUDGE0_BASE_URL = "https://ce.judge0.com";

const LANGUAGE_ID_MAP = {
  javascript: 63,
  python: 71,
  java: 62,
};

export async function executeCode(req, res) {
  try {
    const { language, files } = req.body || {};
    const sourceCode = Array.isArray(files) && files.length > 0 ? files[0]?.content || "" : "";
    const languageId = LANGUAGE_ID_MAP[language];

    if (!language || !languageId || !sourceCode) {
      return res.status(400).json({
        success: false,
        error: "Valid language and non-empty source code are required",
      });
    }

    const upstreamResponse = await fetch(
      `${JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=true`,
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
        body: JSON.stringify({
          language_id: languageId,
          source_code: sourceCode,
        }),
      }
    );

    const raw = await upstreamResponse.text();
    let payload = null;

    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = null;
    }

    if (!upstreamResponse.ok) {
      return res.status(upstreamResponse.status).json({
        success: false,
        error:
          payload?.message ||
          payload?.error ||
          `Code execution provider error: ${upstreamResponse.status}`,
      });
    }

    const output = payload?.stdout || "";
    const stderr = payload?.stderr || "";
    const compileError = payload?.compile_output || "";
    const message = payload?.message || "";
    const statusDescription = payload?.status?.description || "";

    const errorText = stderr || compileError || message;

    if (errorText) {
      return res.status(200).json({
        success: false,
        output,
        error: errorText,
      });
    }

    return res.status(200).json({
      success: true,
      output: output || statusDescription || "No output",
    });
  } catch (error) {
    console.error("Error in executeCode controller:", error.message);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
}
