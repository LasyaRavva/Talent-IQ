const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

const normalizeBaseUrl = (url) => {
  if (!url) return null;

  const trimmed = String(url).trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return null;
  }
};

export const getInviteBaseUrl = () => {
  if (typeof window === "undefined") return null;

  const host = window.location.hostname;
  const envBaseUrl = normalizeBaseUrl(import.meta.env.VITE_PUBLIC_APP_URL);
  if (envBaseUrl) return envBaseUrl;

  if (LOCAL_HOSTS.has(host)) return window.location.origin;

  return window.location.origin;
};

export const buildInviteUrl = (sessionToken) => {
  const baseUrl = getInviteBaseUrl();
  if (!baseUrl || !sessionToken) return null;

  return `${baseUrl}/session/${sessionToken}`;
};
