import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { aiApi } from "../api/ai";

const MAX_FALLBACK_RECORDING_MS = 10000;
const RECORDED_FALLBACK_DISABLED_MESSAGE =
  "Recorded voice transcription is disabled in this Ollama setup. Use Chrome or Edge speech input, or type your message instead.";

const getSpeechErrorMessage = (error) => {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission is blocked. Allow mic access in your browser settings and try again.";
    case "audio-capture":
      return "No working microphone was found. Check your microphone connection and browser device settings.";
    case "network":
      return "Browser speech recognition is unavailable here. Switching to recorded transcription can help.";
    case "no-speech":
      return "No speech was detected. Click the mic again and start speaking right away.";
    case "language-not-supported":
      return "The selected speech language is not supported by your browser.";
    default:
      return "Voice input could not start. Try Chrome or Edge, allow microphone access, and try again.";
  }
};

const detectSpeechRecognitionApi = () => {
  if (typeof window === "undefined") return null;

  const userAgent = window.navigator.userAgent || "";
  const isEdgeBrowser = /Edg\//.test(userAgent);

  if (isEdgeBrowser && window.webkitSpeechRecognition) {
    return {
      RecognitionApi: window.webkitSpeechRecognition,
      isEdgeBrowser,
    };
  }

  return {
    RecognitionApi: window.SpeechRecognition || window.webkitSpeechRecognition || null,
    isEdgeBrowser,
  };
};

const ensureMicrophoneAccess = async () => {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone access is not available in this browser.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  return stream;
};

const readBlobAsDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Audio recording could not be read."));
    reader.readAsDataURL(blob);
  });

function useSpeechInput({ onTranscript, onError, lang = "en-US", allowRecordedFallback = false }) {
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimeoutRef = useRef(null);
  const baseTextRef = useRef("");
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);
  const [isListening, setIsListening] = useState(false);
  const [lastError, setLastError] = useState("");
  const [inputMode, setInputMode] = useState("idle");
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const { RecognitionApi: SpeechRecognitionApi, isEdgeBrowser } = useMemo(() => {
    const result = detectSpeechRecognitionApi();
    return result || { RecognitionApi: null, isEdgeBrowser: false };
  }, []);

  const isSupported = Boolean(
    SpeechRecognitionApi || (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia)
  );

  const isSecureOrigin = useMemo(() => {
    if (typeof window === "undefined") return true;
    return (
      window.isSecureContext ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  }, []);

  const stopMediaTracks = useCallback(() => {
    if (!mediaStreamRef.current) return;
    mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const clearRecordingTimeout = useCallback(() => {
    if (!recordingTimeoutRef.current) return;
    window.clearTimeout(recordingTimeoutRef.current);
    recordingTimeoutRef.current = null;
  }, []);

  const finishRecorderTranscription = useCallback(async () => {
    const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
    const recordedBlob = new Blob(recordedChunksRef.current, { type: mimeType });
    recordedChunksRef.current = [];

    if (!recordedBlob.size) {
      setInputMode("idle");
      return;
    }

    try {
      setInputMode("transcribing");
      setIsTranscribing(true);
      const audioBase64 = await readBlobAsDataUrl(recordedBlob);
      const result = await aiApi.transcribeAudio({ audioBase64, mimeType });
      const transcript = result?.text?.trim?.() || "";
      const nextValue = [baseTextRef.current.trim(), transcript].filter(Boolean).join(" ");
      onTranscriptRef.current?.(nextValue);
      setLastError("");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Recorded transcription failed. Ollama chat can still work, but voice fallback needs a configured transcription provider.";
      setLastError(message);
      onErrorRef.current?.(message);
    } finally {
      setInputMode("idle");
      setIsTranscribing(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    clearRecordingTimeout();

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, [clearRecordingTimeout]);

  const startRecorderFallback = useCallback(
    async (baseText = "") => {
      if (!allowRecordedFallback) {
        setInputMode("idle");
        setIsTranscribing(false);
        setLastError(RECORDED_FALLBACK_DISABLED_MESSAGE);
        onErrorRef.current?.(RECORDED_FALLBACK_DISABLED_MESSAGE);
        return;
      }

      try {
        const stream = await ensureMicrophoneAccess();
        baseTextRef.current = baseText;
        recordedChunksRef.current = [];
        mediaStreamRef.current = stream;

        const preferredMimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "";
        const recorder = preferredMimeType
          ? new MediaRecorder(stream, {
              mimeType: preferredMimeType,
              audioBitsPerSecond: 32000,
            })
          : new MediaRecorder(stream, { audioBitsPerSecond: 32000 });

        recorder.onstart = () => {
          setLastError("");
          setIsListening(true);
          setInputMode("recording");
          clearRecordingTimeout();
          recordingTimeoutRef.current = window.setTimeout(() => {
            if (recorder.state !== "inactive") {
              recorder.stop();
            }
          }, MAX_FALLBACK_RECORDING_MS);
        };

        recorder.ondataavailable = (event) => {
          if (event.data?.size) {
            recordedChunksRef.current.push(event.data);
          }
        };

        recorder.onerror = () => {
          const message = "Audio recording failed. Check your microphone and browser permissions.";
          setLastError(message);
          onErrorRef.current?.(message);
        };

        recorder.onstop = async () => {
          clearRecordingTimeout();
          setIsListening(false);
          mediaRecorderRef.current = null;
          stopMediaTracks();
          await finishRecorderTranscription();
        };

        mediaRecorderRef.current = recorder;
        recorder.start(1000);
      } catch (error) {
        clearRecordingTimeout();
        stopMediaTracks();
        setIsListening(false);
        setInputMode("idle");
        const message =
          error?.message || "Microphone access failed. Allow microphone permission and try again.";
        setLastError(message);
        onErrorRef.current?.(message);
      }
    },
    [allowRecordedFallback, clearRecordingTimeout, finishRecorderTranscription, stopMediaTracks]
  );

  const startSpeechRecognition = useCallback(
    async (baseText = "") => {
      if (!SpeechRecognitionApi) {
        await startRecorderFallback(baseText);
        return;
      }

      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }

      try {
        const warmupStream = await ensureMicrophoneAccess();
        warmupStream.getTracks().forEach((track) => track.stop());

        const recognition = new SpeechRecognitionApi();
        recognition.lang = lang;
        recognition.continuous = !isEdgeBrowser;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        baseTextRef.current = baseText;

        recognition.onstart = () => {
          setLastError("");
          setIsListening(true);
          setInputMode("speech");
        };

        recognition.onresult = (event) => {
          let transcript = "";

          for (let index = 0; index < event.results.length; index += 1) {
            transcript += event.results[index][0]?.transcript || "";
          }

          const nextValue = [baseTextRef.current.trim(), transcript.trim()].filter(Boolean).join(" ");
          onTranscriptRef.current?.(nextValue);
        };

        recognition.onerror = async (event) => {
          if (event.error === "aborted") return;

          recognitionRef.current = null;
          setIsListening(false);
          setInputMode("idle");

          if (event.error === "network") {
            const message = allowRecordedFallback
              ? "Edge browser speech service failed. Falling back to recorded transcription."
              : "Browser speech service failed. Recorded transcription is disabled for this Ollama setup.";
            setLastError(message);
            onErrorRef.current?.(message);
            if (allowRecordedFallback) {
              await startRecorderFallback(baseTextRef.current);
            }
            return;
          }

          const message = getSpeechErrorMessage(event.error);
          setLastError(message);
          onErrorRef.current?.(message);
        };

        recognition.onend = () => {
          setIsListening(false);
          if (recognitionRef.current === recognition) {
            recognitionRef.current = null;
          }
          if (inputMode === "speech") {
            setInputMode("idle");
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (error) {
        const message =
          error?.message || "Voice input could not start. Allow microphone access and try again.";
        setLastError(message);
        onErrorRef.current?.(message);
        await startRecorderFallback(baseText);
      }
    },
    [SpeechRecognitionApi, allowRecordedFallback, inputMode, isEdgeBrowser, lang, startRecorderFallback]
  );

  const toggleListening = useCallback(
    async (baseText = "") => {
      if (isListening || isTranscribing) {
        stopListening();
        return;
      }

      if (!isSecureOrigin) {
        const message =
          "Voice input needs a secure origin. Open the site on HTTPS or localhost and try again.";
        setLastError(message);
        onErrorRef.current?.(message);
        return;
      }

      await startSpeechRecognition(baseText);
    },
    [isListening, isSecureOrigin, isTranscribing, startSpeechRecognition, stopListening]
  );

  useEffect(
    () => () => {
      stopListening();
      clearRecordingTimeout();
      stopMediaTracks();
    },
    [clearRecordingTimeout, stopListening, stopMediaTracks]
  );

  return {
    inputMode,
    isListening,
    isSupported,
    isSecureOrigin,
    isTranscribing,
    lastError,
    startListening: startSpeechRecognition,
    stopListening,
    toggleListening,
  };
}

export default useSpeechInput;
