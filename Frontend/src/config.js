const getBackendUrl = () => {
  let url = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
  url = url.trim().replace(/\/$/, "");
  if (!url.endsWith("/api")) {
    url += "/api";
  }
  return url;
};

export const BASE_URL = getBackendUrl();
export const token = localStorage.getItem("token");
