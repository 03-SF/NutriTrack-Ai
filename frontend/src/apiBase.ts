export function getApiBase(): string {
  const envBase = (import.meta.env.VITE_BACKEND_URL as string) || "";
  const trimmed = envBase.trim().replace(/\/+$/, "");

  const host = window.location.hostname;
  const isLocalHost = host === "localhost" || host === "127.0.0.1";

  if (trimmed) {
    const isLocalEnv =
      trimmed.includes("localhost") || trimmed.includes("127.0.0.1");

    // If someone accidentally set VITE_BACKEND_URL=localhost on Vercel,
    // ignore it and use same-origin.
    if (!isLocalHost && isLocalEnv) {
      return "";
    }

    return trimmed;
  }

  return isLocalHost ? "http://localhost:5000" : "";
}

export const API_BASE = getApiBase();
