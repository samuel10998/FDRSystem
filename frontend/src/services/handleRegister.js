import axios from 'axios';

export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};



export const validateFields = ({ name, surname, email, password }) => {
    return {
        name: !name.trim(),
        surname: !surname.trim(),
        email: !email.trim() || !validateEmail(email),
        password: !password.trim(),
    };
};

export const handleRegisterSubmit = async (fields, navigate) => {
    try {
        await axios.post('http://localhost:8080/api/register', fields);
        navigate('/api/login');
    } catch (error) {
        console.error('Error registering user:', error);
    }
};