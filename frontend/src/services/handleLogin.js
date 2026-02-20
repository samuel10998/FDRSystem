import api from "../api";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 min

export const handleLogin = async ({ email, password, toast, navigate }) => {
    if (!email || !password) {
        toast.current.show({ severity: "error", summary: "Chyba", detail: "Prosím vyplnte všetky polia" });
        return;
    }

    try {
        const response = await api.post("/api/login", { email, password });
        const { token, user, expiresAt } = response.data;

        localStorage.setItem("jwtToken", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("userId", user.id);

        const fallbackExp = Date.now() + IDLE_TIMEOUT_MS;
        localStorage.setItem("tokenExpiration", String(Number(expiresAt) || fallbackExp));
        localStorage.setItem("lastActivityAt", String(Date.now()));

        window.dispatchEvent(new Event("auth-changed"));
        navigate("/home");
    } catch (error) {
        toast.current.show({
            severity: "error",
            summary: "Chyba",
            detail: error.response?.data?.message ?? "Prihlásenie sa nepodarilo",
        });
    }
};
