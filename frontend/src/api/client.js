import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

let authContextRef = {
  current: {
    accessToken: null,
    refreshToken: null,
    setAccessToken: () => {},
    clearAuth: () => {},
  },
};

export function setAuthContextRef(ref) {
  authContextRef.current = ref;
}

let refreshPromise = null;

client.interceptors.request.use(
  (config) => {
    const token = authContextRef.current?.accessToken || localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const refreshToken = authContextRef.current?.refreshToken || localStorage.getItem('refresh_token');
            if (!refreshToken) {
              throw new Error("No refresh token available");
            }

            const response = await axios.post(
              "http://localhost:8000/api/v1/auth/refresh/",
              { refresh: refreshToken },
            );
            const nextAccessToken = response.data?.access;

            if (!nextAccessToken) {
              throw new Error(
                "Refresh response did not contain an access token",
              );
            }

            if (authContextRef.current?.setAccessToken) {
              authContextRef.current.setAccessToken(nextAccessToken);
            } else {
              localStorage.setItem('access_token', nextAccessToken);
            }
            originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
            return client(originalRequest);
          } catch (refreshError) {
            authContextRef.current?.clearAuth();
            window.location.assign("/login");
            return Promise.reject(refreshError);
          } finally {
            refreshPromise = null;
          }
        })();
      }

      return refreshPromise;
    }

    if (error.response?.status === 401) {
      authContextRef.current?.clearAuth();
      window.location.assign("/login");
    }

    return Promise.reject(error);
  },
);

export default client;
