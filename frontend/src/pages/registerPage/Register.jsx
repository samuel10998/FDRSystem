import React, { useState } from "react"; // Odstránený useEffect
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { useNavigate } from "react-router-dom";
import {
    validateFields,
    handleRegisterSubmit,
} from "../../services/handleRegister"; // Odstránené initializeSchools a handleSchoolChange
import "./register.css";

export default function Register() {
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [touchedFields, setTouchedFields] = useState({
        name: false,
        surname: false,
        email: false,
        password: false,
    });

    const navigate = useNavigate();

    const handleRegister = () => {
        const fields = { name, surname, email, password };
        const errors = validateFields(fields);
        if (Object.values(errors).every((error) => !error)) {
            handleRegisterSubmit(fields, navigate);
        } else {
            setTouchedFields({
                name: true,
                surname: true,
                email: true,
                password: true,
            });
        }
    };

    const handleBlur = (field) => {
        setTouchedFields((prev) => ({ ...prev, [field]: true }));
    };

    const errors = validateFields({ name, surname, email, password });

    return (
        <div className="register-container">
            <Panel header="Register">
                <div className="p-field">
                    <label htmlFor="name">Meno</label>
                    <InputText
                        id="name"
                        value={name}
                        placeholder="Meno"
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => handleBlur("name")}
                        className={
                            touchedFields.name && errors.name ? "p-invalid" : ""
                        }
                    />
                    {touchedFields.name && errors.name && (
                        <small className="p-error">Name is required.</small>
                    )}
                </div>
                <div className="p-field">
                    <label htmlFor="surname">Priezvisko</label>
                    <InputText
                        id="surname"
                        value={surname}
                        placeholder="Priezvisko"
                        onChange={(e) => setSurname(e.target.value)}
                        onBlur={() => handleBlur("surname")}
                        className={
                            touchedFields.surname && errors.surname
                                ? "p-invalid"
                                : ""
                        }
                    />
                    {touchedFields.surname && errors.surname && (
                        <small className="p-error">Surname is required.</small>
                    )}
                </div>
                <div className="p-field">
                    <label htmlFor="email">Email</label>
                    <InputText
                        id="email"
                        value={email}
                        placeholder="Email"
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => handleBlur("email")}
                        tooltip="Allowed email domains: @student.ukf.sk, @gmail.com"
                        className={
                            touchedFields.email && errors.email
                                ? "p-invalid"
                                : ""
                        }
                    />
                    {touchedFields.email && errors.email && (
                        <small className="p-error">
                            Valid email is required.
                        </small>
                    )}
                </div>
                <div className="p-field">
                    <label htmlFor="password">Heslo</label>
                    <InputText
                        id="password"
                        type="password"
                        value={password}
                        placeholder="Heslo"
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => handleBlur("password")}
                        className={
                            touchedFields.password && errors.password
                                ? "p-invalid"
                                : ""
                        }
                    />
                    {touchedFields.password && errors.password && (
                        <small className="p-error">
                            Password is required.
                        </small>
                    )}
                </div>

                <div className="button-group">
                    <Button
                        label="Registrovať sa"
                        icon="pi pi-user"
                        onClick={handleRegister}
                        className="p-button-success button-spacing"
                    />
                    <Button
                        label="Zrušiť"
                        icon="pi pi-times"
                        onClick={() => navigate("/api/login")}
                        className="p-button-secondary"
                    />
                </div>
            </Panel>
        </div>
    );
}
