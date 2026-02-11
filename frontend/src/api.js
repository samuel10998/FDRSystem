import axios from "axios";

// CRA env var: REACT_APP_*
const baseURL = process.env.REACT_APP_API_URL || "";

const api = axios.create({ baseURL });

api.interceptors.request.use((cfg) => {
    const token = localStorage.getItem("jwtToken");
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

export default api;
