import axios from "axios";

// CRA env var: REACT_APP_*
const baseURL = process.env.REACT_APP_API_URL || "";

const api = axios.create({ baseURL });

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // refresh keď zostáva < 5 min
let refreshPromise = null;

const clearAuth = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("tokenExpiration");
    localStorage.removeItem("lastActivityAt");
    window.dispatchEvent(new Event("auth-changed"));
};

const setTokenData = (token, expiresAt) => {
    localStorage.setItem("jwtToken", token);
    if (expiresAt) localStorage.setItem("tokenExpiration", String(expiresAt));
    localStorage.setItem("lastActivityAt", String(Date.now()));
    window.dispatchEvent(new Event("auth-changed"));
};

const refreshToken = async () => {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        const current = localStorage.getItem("jwtToken");
        if (!current) throw new Error("No token to refresh");

        const res = await axios.post(
            `${baseURL}/api/auth/refresh`,
            {},
            { headers: { Authorization: `Bearer ${current}` } }
        );

        const { token, expiresAt } = res.data || {};
        if (!token) throw new Error("Refresh did not return token");

        setTokenData(token, expiresAt);
        return token;
    })();

    try {
        return await refreshPromise;
    } finally {
        refreshPromise = null;
    }
};

api.interceptors.request.use(async (cfg) => {
    if (cfg.url?.includes("/api/login") || cfg.url?.includes("/api/auth/refresh")) {
        return cfg;
    }

    let token = localStorage.getItem("jwtToken");
    if (!token) return cfg;

    const exp = Number(localStorage.getItem("tokenExpiration") || 0);
    const now = Date.now();

    // hard-expired token -> clear immediately
    if (exp && now >= exp) {
        clearAuth();
        return cfg;
    }

    // active user + token close to expiry -> rotate token
    if (exp && exp - now <= REFRESH_THRESHOLD_MS) {
        try {
            token = await refreshToken();
        } catch {
            clearAuth();
            return cfg;
        }
    }

    cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            clearAuth();
        }
        return Promise.reject(error);
    }
);

export default api;
