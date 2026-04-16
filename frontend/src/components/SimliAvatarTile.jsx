import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { BotIcon, Loader2Icon, VideoIcon } from "lucide-react";
import { aiApi } from "../api/ai";

function SimliAvatarTile({ title, statusText, accentActive, className = "", mediaClassName = "" }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const simliClientRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const getAvatarErrorMessage = (error) => {
      if (typeof error === "string" && error.trim()) {
        return error;
      }

      const status = error?.response?.status;
      const apiMessage = error?.response?.data?.message;
      const rawMessage = error?.message || "Unable to start Simli avatar";

      if (status === 404) {
        return "Avatar API route not found. Restart the backend server so the new /api/ai/avatar/session route is loaded.";
      }

      if (apiMessage) {
        return apiMessage;
      }

      return rawMessage;
    };

    const startAvatar = async () => {
      setIsLoading(true);
      setAvatarError("");

      try {
        const { sessionToken, transportMode } = await aiApi.createAvatarSession();
        const simliModule = await import("simli-client");
        const SimliClient = simliModule.SimliClient;
        const LogLevel = simliModule.LogLevel;

        if (!videoRef.current || !audioRef.current) {
          throw new Error("Simli media elements are not ready");
        }

        const client = new SimliClient(
          sessionToken,
          videoRef.current,
          audioRef.current,
          null,
          LogLevel.INFO,
          transportMode || "p2p"
        );

        simliClientRef.current = client;
        await client.start();

        if (!isMounted) return;
        setIsConnected(true);
      } catch (error) {
        if (!isMounted) return;
        const message = getAvatarErrorMessage(error);
        setAvatarError(message);
        toast.error(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    startAvatar();

    return () => {
      isMounted = false;
      const client = simliClientRef.current;
      simliClientRef.current = null;
      if (client?.stop) {
        client.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className={`rounded-2xl overflow-hidden border border-base-300 bg-slate-950 text-white ${className}`}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-slate-400">{avatarError || statusText}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span
            className={`inline-block size-2 rounded-full ${
              isConnected && accentActive ? "bg-emerald-400 animate-pulse" : isConnected ? "bg-emerald-400" : "bg-slate-500"
            }`}
          />
          {isConnected ? "Connected" : isLoading ? "Starting" : "Idle"}
        </div>
      </div>

      <div className="relative min-h-[220px] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_42%),linear-gradient(135deg,#020617,#111827,#0f172a)]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`h-full min-h-[220px] w-full object-cover object-top ${mediaClassName}`}
        />
        <audio ref={audioRef} autoPlay />

        {!isConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/70">
            {isLoading ? (
              <Loader2Icon className="size-8 animate-spin text-cyan-200" />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/10">
                <BotIcon className="size-10 text-cyan-200" />
              </div>
            )}
            <p className="text-sm text-slate-200">
              {avatarError ? "Simli avatar unavailable" : "Preparing AI video avatar"}
            </p>
            {avatarError ? (
              <p className="max-w-[260px] text-center text-xs text-slate-400">
                {avatarError.includes("Avatar API route not found")
                  ? "Restart the backend. After that, add `SIMLI_API_KEY` and `SIMLI_FACE_ID` in `backend/.env` if the avatar is still unavailable."
                  : "Add valid Simli credentials in `backend/.env` to turn this into a real AI video participant."}
              </p>
            ) : null}
          </div>
        )}

        {isConnected ? (
          <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1 text-xs">
            <VideoIcon className="size-3.5" />
            AI avatar live
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default SimliAvatarTile;
