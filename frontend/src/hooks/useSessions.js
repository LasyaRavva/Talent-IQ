import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth, useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { sessionApi } from "../api/sessions";

const shouldRetrySessionQuery = (failureCount, error) => {
  const status = error?.response?.status;

  // Do not retry on client/auth errors; retries only add duplicate noisy requests.
  if (status && status >= 400 && status < 500) return false;

  return failureCount < 2;
};

export const useCreateSession = () => {
  const result = useMutation({
    mutationKey: ["createSession"],
    mutationFn: sessionApi.createSession,
    onSuccess: () => toast.success("Session created successfully!"),
    onError: (error) => toast.error(error.response?.data?.message || "Failed to create room"),
  });

  return result;
};

export const useActiveSessions = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isLoaded, isSignedIn } = useAuth();

  const result = useQuery({
    queryKey: ["activeSessions", user?.id || "anonymous"],
    queryFn: sessionApi.getActiveSessions,
    enabled: isLoaded && isUserLoaded && isSignedIn,
    retry: shouldRetrySessionQuery,
  });

  return result;
};

export const useMyRecentSessions = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isLoaded, isSignedIn } = useAuth();

  const result = useQuery({
    queryKey: ["myRecentSessions", user?.id || "anonymous"],
    queryFn: sessionApi.getMyRecentSessions,
    enabled: isLoaded && isUserLoaded && isSignedIn,
    retry: shouldRetrySessionQuery,
  });

  return result;
};

export const useSessionById = (id) => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isLoaded, isSignedIn } = useAuth();

  const result = useQuery({
    queryKey: ["session", id, user?.id || "anonymous"],
    queryFn: () => sessionApi.getSessionById(id),
    enabled: !!id && isLoaded && isUserLoaded && isSignedIn,
    refetchInterval: 5000, // refetch every 5 seconds to detect session status changes
  });

  return result;
};

export const useJoinSession = () => {
  const result = useMutation({
    mutationKey: ["joinSession"],
    mutationFn: sessionApi.joinSession,
    onSuccess: (data) => {
      const message = data?.message;

      if (message === "Already joined" || message === "Host already in session") return;

      toast.success("Joined session successfully!");
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to join session"),
  });

  return result;
};

export const useEndSession = () => {
  const result = useMutation({
    mutationKey: ["endSession"],
    mutationFn: sessionApi.endSession,
    onSuccess: () => toast.success("Session ended successfully!"),
    onError: (error) => toast.error(error.response?.data?.message || "Failed to end session"),
  });

  return result;
};

export const useLeaveSession = () => {
  const result = useMutation({
    mutationKey: ["leaveSession"],
    mutationFn: sessionApi.leaveSession,
    onSuccess: () => toast.success("Left session successfully!"),
    onError: (error) => toast.error(error.response?.data?.message || "Failed to leave session"),
  });

  return result;
};
