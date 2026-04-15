import axiosInstance from "../lib/axios";

const normalizeApiPayload = (payload) => {
  if (payload && typeof payload === "object" && "data" in payload && payload.data) {
    return payload.data;
  }

  return payload;
};

export const sessionApi = {
  createSession: async (data) => {
    const response = await axiosInstance.post("/api/sessions", data);
    return response.data;
  },

  getActiveSessions: async () => {
    const response = await axiosInstance.get("/api/sessions/active");
    return response.data;
  },
  getMyRecentSessions: async () => {
    const response = await axiosInstance.get("/api/sessions/my-recent");
    return response.data;
  },

  getSessionById: async (id) => {
    const response = await axiosInstance.get(`/api/sessions/${id}`);
    return response.data;
  },

  joinSession: async (id) => {
    const response = await axiosInstance.post(`/api/sessions/${id}/join`);
    return response.data;
  },
  leaveSession: async (id) => {
    const response = await axiosInstance.post(`/api/sessions/${id}/leave`);
    return response.data;
  },
  endSession: async (id) => {
    const response = await axiosInstance.post(`/api/sessions/${id}/end`);
    return response.data;
  },
  getStreamToken: async (authToken) => {
    const requestConfig = {
      headers: authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : undefined,
    };

    const response = await axiosInstance.get("/api/chat/token", requestConfig);
    const payload = normalizeApiPayload(response.data);

    if (typeof payload === "string") {
      throw new Error("Token endpoint returned text instead of JSON. Check VITE_API_URL and backend server.");
    }

    return payload;
  },
};
