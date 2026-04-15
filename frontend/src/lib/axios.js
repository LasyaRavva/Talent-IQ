import axios from "axios";

const normalizeBaseUrl = (value) => {
  if (!value) return "";

  const trimmedValue = value.trim().replace(/\/+$/, "");
  if (!trimmedValue) return "";

  return trimmedValue.endsWith("/api") ? trimmedValue.slice(0, -4) : trimmedValue;
};

const axiosInstance = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_URL),
  withCredentials: true, // by adding this field browser will send the cookies to server automatically, on every single req
});

let authTokenGetter = null;
let authUserGetter = null;

export const setAuthTokenGetter = (getter) => {
  authTokenGetter = typeof getter === "function" ? getter : null;
};

export const setAuthUserGetter = (getter) => {
  authUserGetter = typeof getter === "function" ? getter : null;
};

export const getAuthRequestHeaders = async () => {
  let token = null;
  let authUser = null;

  if (authTokenGetter) {
    token = await authTokenGetter();
  } else if (typeof window !== "undefined" && window.Clerk?.session) {
    token = await window.Clerk.session.getToken();
  }

  if (authUserGetter) {
    authUser = await authUserGetter();
  } else if (typeof window !== "undefined" && window.Clerk?.user) {
    authUser = window.Clerk.user;
  }

  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (authUser?.id) {
    headers["X-Dev-Clerk-User-Id"] = authUser.id;
    headers["X-Dev-User-Name"] =
      authUser.fullName ||
      authUser.username ||
      authUser.primaryEmailAddress?.emailAddress ||
      "Talent IQ User";
    headers["X-Dev-User-Email"] =
      authUser.primaryEmailAddress?.emailAddress || `${authUser.id}@local.user`;
    headers["X-Dev-User-Image"] = authUser.imageUrl || "";
  }

  return headers;
};

axiosInstance.interceptors.request.use(async (config) => {
  const headers = await getAuthRequestHeaders();
  config.headers = { ...(config.headers || {}), ...headers };

  return config;
});

export default axiosInstance;
