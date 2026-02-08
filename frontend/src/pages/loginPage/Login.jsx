import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useNavigate, useLocation } from "react-router-dom";
import { handleLogin } from "../../services/handleLogin";
import "./login.css";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorFields, setErrorFields] = useState({ email: false, password: false });
    const toast = React.useRef(null);

    const navigate = useNavigate();
    const location = useLocation();

    const validateEmail = (value) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(value).toLowerCase());
    };

    const openRegisterModal = () => {
        navigate("/register", { state: { backgroundLocation: location } });
    };

    const onSubmit = (e) => {
        e.preventDefault();

        const emailOk = !!email && validateEmail(email);
        const pwdOk = !!password;

        setErrorFields({
            email: !emailOk,
            password: !pwdOk,
        });

        if (!emailOk || !pwdOk) return;

        handleLogin({ email, password, toast, navigate });
    };

    return (
        <div className="login-container">
            <Toast ref={toast} />
            <div className="login-box">
                <div className="login-image">
                    <img
                        src="https://images.unsplash.com/photo-1670348564705-6be8279f53a8?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt="logimage"
                    />
                </div>

                <form className="login-form" onSubmit={onSubmit}>
                    <h1>Systém na vizualizáciu dát zo zapisovača letových údajov</h1>
                    <p>Prihláste sa do svojho účtu</p>

                    <InputText
                        id="email"
                        value={email}
                        placeholder="Email"
                        autoComplete="email"
                        name="email"
                        onChange={(e) => {
                            setErrorFields((prev) => ({ ...prev, email: false }));
                            setEmail(e.target.value);
                        }}
                        onBlur={() => {
                            if (!email || !validateEmail(email)) {
                                setErrorFields((prev) => ({ ...prev, email: true }));
                            }
                        }}
                        className={errorFields.email ? "p-invalid" : ""}
                    />

                    <InputText
                        id="password"
                        type="password"
                        value={password}
                        placeholder="Heslo"
                        autoComplete="current-password"
                        name="password"
                        onChange={(e) => {
                            setErrorFields((prev) => ({ ...prev, password: false }));
                            setPassword(e.target.value);
                        }}
                        onBlur={() => {
                            if (!password) {
                                setErrorFields((prev) => ({ ...prev, password: true }));
                            }
                        }}
                        className={errorFields.password ? "p-invalid" : ""}
                    />

                    {/* ✅ keep your custom classes + also add a shared class for sizing */}
                    <Button
                        label="Prihlásenie"
                        icon="pi pi-sign-in"
                        type="submit"
                        className="login-btn login-button-login"
                    />

                    <Button
                        label="Registrácia"
                        icon="pi pi-user"
                        type="button"
                        onClick={openRegisterModal}
                        className="login-btn login-button-register"
                    />
                </form>
            </div>
        </div>
    );
}
