import api from "../api";

export const handleLogin = async ({ email, password, toast, navigate }) => {
    if (!email || !password) {
        toast.current.show({ severity: "error", summary: "Chyba", detail: "Prosím vyplnte všetky polia" });
        return;
    }

    try {
        const response = await api.post("/api/login", { email, password });
        const { token, user } = response.data;

        localStorage.setItem("jwtToken", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("userId", user.id);

        navigate("/home");
    } catch (error) {
        toast.current.show({
            severity: "error",
            summary: "Chyba",
            detail: error.response?.data?.message ?? "Prihlásenie sa nepodarilo",
        });
    }
};
