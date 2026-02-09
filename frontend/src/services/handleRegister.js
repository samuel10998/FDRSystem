import api from "../api";

/* ---------- Email validácia ---------- */
export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

/* ---------- Validácia hesla ---------- */
const isValidPassword = (password) => {
    const letterCount = (password.match(/[A-Za-z]/g) || []).length;
    const numberCount = (password.match(/[0-9]/g) || []).length;
    return letterCount >= 6 && numberCount >= 4;
};

/* ---------- Validácia polí ---------- */
export const validateFields = ({ name, surname, email, password, region }) => {
    return {
        name: !name.trim(),
        surname: !surname.trim(),
        email: !email.trim() || !validateEmail(email),
        password: !isValidPassword(password),
        region: !region || !region.trim(),
    };
};

/* ---------- API request pre registráciu ---------- */
export const handleRegisterSubmit = async (fields) => {
    return api.post("/api/register", fields);
};
