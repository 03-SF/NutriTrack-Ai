import { useEffect } from "react";

export default function useGoogleFitAuth() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.replace("#", ""));
    const token = params.get("token");
    const connected = params.get("connected");

    if (connected === "googlefit" && token) {
      localStorage.setItem("googleFitToken", token);
      window.location.hash = ""; // cleanup
    }
  }, []);
}
