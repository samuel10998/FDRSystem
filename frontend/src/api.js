import axios from "axios";

/** ----------------------------------------------------------
 *  Jediná axios‑inštancia pre celý FE
 *  – baseURL smeruje na Spring‑Boot (8080)
 * -------------------------------------------------------- */
const api = axios.create({
    baseURL: "http://localhost:8080",
});

api.interceptors.request.use((cfg) => {
    const token = localStorage.getItem("jwtToken");
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

export default api;
