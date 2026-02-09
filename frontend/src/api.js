import axios from "axios";

const api = axios.create({
    baseURL: "", // => volá /api/... na localhost:3000, proxy to hodí na backend
});

api.interceptors.request.use((cfg) => {
    const token = localStorage.getItem("jwtToken");
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

export default api;
