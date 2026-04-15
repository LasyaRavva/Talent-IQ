import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import { initializeStreamClient, disconnectStreamClient } from "../lib/stream";
import { sessionApi } from "../api/sessions";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function useStreamClient(session, loadingSession, isHost, isParticipant) {
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [streamClient, setStreamClient] = useState(null);
  const [call, setCall] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [isInitializingCall, setIsInitializingCall] = useState(true);
  const [callError, setCallError] = useState("");

  useEffect(() => {
    let videoCall = null;
    let chatClientInstance = null;
    let isMounted = true;

    const initCall = async () => {
      if (!session?.callId || session.status === "completed") {
        if (isMounted) setIsInitializingCall(false);
        return;
      }

      if (!isHost && !isParticipant) {
        if (isMounted) setIsInitializingCall(true);
        return;
      }

      if (!isAuthLoaded || !isUserLoaded) {
        if (isMounted) setIsInitializingCall(true);
        return;
      }

      try {
        if (isMounted) setIsInitializingCall(true);
        if (isMounted) setCallError("");

        if (!isSignedIn) {
          throw new Error("You must be signed in to join the video call");
        }

        const authToken = await getToken();
        const streamAuth = await sessionApi.getStreamToken(authToken);
        const token = streamAuth?.token;
        const userId = streamAuth?.userId;
        const userName = streamAuth?.userName;
        const userImage = streamAuth?.userImage;
        const streamUserId = userId || user?.id;
        const streamUserName =
          userName ||
          user?.fullName ||
          user?.username ||
          user?.primaryEmailAddress?.emailAddress ||
          "Talent IQ User";
        const streamUserImage = userImage || user?.imageUrl || "";

        if (!token) {
          const responseKeys =
            streamAuth && typeof streamAuth === "object" ? Object.keys(streamAuth).join(", ") : "";
          throw new Error(
            streamAuth?.message ||
              (responseKeys
                ? `Missing Stream token. Token response keys: ${responseKeys}`
                : "Missing Stream token")
          );
        }

        if (!streamUserId) {
          throw new Error("Missing Stream user id");
        }

        const client = await initializeStreamClient(
          {
            id: streamUserId,
            name: streamUserName,
            image: streamUserImage,
          },
          token
        );

        setStreamClient(client);

        videoCall = client.call("default", session.callId);
        let lastJoinError = null;
        for (let attempt = 0; attempt < 5; attempt += 1) {
          try {
            await videoCall.join({ create: true });
            lastJoinError = null;
            break;
          } catch (error) {
            lastJoinError = error;
            await sleep(500);
          }
        }

        if (lastJoinError) throw lastJoinError;

        await Promise.allSettled([videoCall.camera.enable(), videoCall.microphone.enable()]);
        setCall(videoCall);

        const apiKey = import.meta.env.VITE_STREAM_API_KEY;
        chatClientInstance = StreamChat.getInstance(apiKey);

        let lastChatError = null;
        for (let attempt = 0; attempt < 5; attempt += 1) {
          try {
            await chatClientInstance.connectUser(
              {
                id: streamUserId,
                name: streamUserName,
                image: streamUserImage,
              },
              token
            );
            lastChatError = null;
            break;
          } catch (error) {
            lastChatError = error;
            await sleep(500);
          }
        }

        if (lastChatError) throw lastChatError;

        setChatClient(chatClientInstance);

        const chatChannel = chatClientInstance.channel("messaging", session.callId);
        let lastWatchError = null;
        for (let attempt = 0; attempt < 5; attempt += 1) {
          try {
            await chatChannel.watch();
            lastWatchError = null;
            break;
          } catch (error) {
            lastWatchError = error;
            await sleep(500);
          }
        }

        if (lastWatchError) throw lastWatchError;

        setChannel(chatChannel);
      } catch (error) {
        const message =
          error?.response?.data?.message || error?.message || "Unable to connect to the video call";
        if (isMounted) setCallError(message);
        toast.error(message);
        console.error("Error init call", error);
      } finally {
        if (isMounted) setIsInitializingCall(false);
      }
    };

    if (session && !loadingSession) initCall();
    if (!session && !loadingSession) setIsInitializingCall(false);

    // cleanup - performance reasons
    return () => {
      isMounted = false;
      // iife
      (async () => {
        try {
          if (videoCall) await videoCall.leave();
          if (chatClientInstance) await chatClientInstance.disconnectUser();
          await disconnectStreamClient();
        } catch (error) {
          console.error("Cleanup error:", error);
        }
      })();
    };
  }, [getToken, isAuthLoaded, isHost, isParticipant, isSignedIn, isUserLoaded, loadingSession, session, user]);

  return {
    streamClient,
    call,
    chatClient,
    channel,
    isInitializingCall,
    callError,
  };
}

export default useStreamClient;
