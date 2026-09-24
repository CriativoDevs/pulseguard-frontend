import axios from "axios";

export const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const api = axios.create({ baseURL });

// ── Request: inject access token ────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: auto-refresh on 401 ───────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const flushQueue = (token: string) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/login";
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Only try to refresh once per request
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      logout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the ongoing refresh completes
      return new Promise((resolve) => {
        refreshQueue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${baseURL}/auth/token/refresh/`, {
        refresh: refreshToken,
      });
      localStorage.setItem("access_token", data.access);
      api.defaults.headers.common.Authorization = `Bearer ${data.access}`;
      flushQueue(data.access);
      original.headers.Authorization = `Bearer ${data.access}`;
      return api(original);
    } catch {
      logout();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

export const client = api;
export default api;
