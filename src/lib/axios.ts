import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = "http://localhost:3000/api";
const SESSION_ID_KEY = "petfood_session_id";

export const getPetfoodSessionId = () => {
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `guest_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
};

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 15_000,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.headers) {
      config.headers["x-session-id"] = getPetfoodSessionId();
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const AUTH_PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/refresh",
];

const PROTECTED_PATH_PREFIXES = [
  "/checkout",
  "/payment",
  "/rewards",
  "/my-account",
  "/admin",
  "/support",
];

const getRequestPath = (url = "") => {
  try {
    const parsed = new URL(url, BASE_URL);
    return parsed.pathname.replace(/^\/api/, "");
  } catch {
    return url.split("?")[0].replace(/^\/api/, "");
  }
};

const isAuthPublicRequest = (url = "") => {
  const path = getRequestPath(url);
  return AUTH_PUBLIC_PATHS.some((authPath) => path.startsWith(authPath));
};

const clearLocalAuth = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("authUser");
  delete apiClient.defaults.headers.common.Authorization;
};

const isProtectedBrowserPath = () =>
  PROTECTED_PATH_PREFIXES.some((path) => window.location.pathname.startsWith(path));

const redirectToLoginWithoutReload = () => {
  if (window.location.pathname === "/login") return;
  window.history.replaceState({}, "", "/login");
  window.dispatchEvent(new PopStateEvent("popstate"));
};

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const requestUrl = originalRequest?.url || "";
    const shouldSkipRefresh =
      !originalRequest ||
      isAuthPublicRequest(requestUrl) ||
      !localStorage.getItem("accessToken");

    if (error.response?.status === 401 && !originalRequest?._retry && !shouldSkipRefresh) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const newToken: string = data.accessToken;
        localStorage.setItem("accessToken", newToken);
        apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearLocalAuth();
        if (isProtectedBrowserPath()) {
          redirectToLoginWithoutReload();
        }
        return Promise.reject({
          response: {
            status: 401,
            data: {
              message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
            },
          },
        });
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401 && shouldSkipRefresh && !isAuthPublicRequest(requestUrl)) {
      clearLocalAuth();
      if (isProtectedBrowserPath()) {
        redirectToLoginWithoutReload();
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
