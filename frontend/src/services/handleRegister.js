import axios from "axios";

export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

export const validateFields = ({ name, surname, email, password, region }) => {
    return {
        name:     !name.trim(),
        surname:  !surname.trim(),
        email:    !email.trim() || !validateEmail(email),
        password: !password.trim(),
        region:   !region || !region.trim()               // ← nové
    };
};
/* -------------------------------------------------------- */

export const handleRegisterSubmit = async (fields) => {
    return axios.post("http://localhost:8080/api/register", fields);
};
