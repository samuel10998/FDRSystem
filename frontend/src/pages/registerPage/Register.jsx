import React, { useState, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import { PiEye, PiEyeSlash } from "react-icons/pi";

import {
    validateFields,
    handleRegisterSubmit,
} from "../../services/handleRegister";
import "./register.css";

export default function Register() {
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [region, setRegion] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [touchedFields, setTouchedFields] = useState({
        name: false,
        surname: false,
        email: false,
        password: false,
        confirmPassword: false,
        region: false
    });

    const navigate = useNavigate();
    const toast = useRef(null);

    const regionOptions = [
        { label: "Bratislavský kraj", value: "Bratislavský kraj" },
        { label: "Trnavský kraj", value: "Trnavský kraj" },
        { label: "Trenčiansky kraj", value: "Trenčiansky kraj" },
        { label: "Nitriansky kraj", value: "Nitriansky kraj" },
        { label: "Žilinský kraj", value: "Žilinský kraj" },
        { label: "Banskobystrický kraj", value: "Banskobystrický kraj" },
        { label: "Prešovský kraj", value: "Prešovský kraj" },
        { label: "Košický kraj", value: "Košický kraj" }
    ];

    const handleRegister = () => {
        const fields = { name, surname, email, password, region };
        const errors = validateFields(fields);

        if (password !== confirmPassword) {
            toast.current.show({
                severity: "error",
                summary: "Chyba",
                detail: "Heslá sa nezhodujú.",
                life: 3000,
            });
            return;
        }

        if (Object.values(errors).every((error) => !error)) {
            handleRegisterSubmit(fields)
                .then(() => {
                    toast.current.show({
                        severity: "success",
                        summary: "Úspech",
                        detail: "Úspešná registrácia. Skontrolujte svoj email.",
                        life: 4000,
                    });
                    setTimeout(() => navigate("/api/login"), 3000);
                })
                .catch((err) => {
                    const msg =
                        err?.response?.status === 409
                            ? "Email už existuje"
                            : "Chyba pri registrácii skús nový email";
                    toast.current.show({
                        severity: "error",
                        summary: "Chyba",
                        detail: msg,
                        life: 4000,
                    });
                });
        } else {
            setTouchedFields({
                name: true,
                surname: true,
                email: true,
                password: true,
                confirmPassword: true,
                region: true
            });
        }
    };

    const handleBlur = (field) => {
        setTouchedFields((prev) => ({ ...prev, [field]: true }));
    };

    const errors = validateFields({ name, surname, email, password, region });

    return (
        <div className="register-container">
            <Toast ref={toast} />
            <Panel header="Registrácia">
                <div className="p-field">
                    <label htmlFor="name">Meno</label>
                    <InputText id="name" value={name} placeholder="Meno" onChange={(e) => setName(e.target.value)} onBlur={() => handleBlur("name")} className={touchedFields.name && errors.name ? "p-invalid" : ""} />
                    {touchedFields.name && errors.name && <small className="p-error">Name is required.</small>}
                </div>

                <div className="p-field">
                    <label htmlFor="surname">Priezvisko</label>
                    <InputText id="surname" value={surname} placeholder="Priezvisko" onChange={(e) => setSurname(e.target.value)} onBlur={() => handleBlur("surname")} className={touchedFields.surname && errors.surname ? "p-invalid" : ""} />
                    {touchedFields.surname && errors.surname && <small className="p-error">Surname is required.</small>}
                </div>

                <div className="p-field">
                    <label htmlFor="region">Región</label>
                    <Dropdown id="region" value={region} options={regionOptions} placeholder="Vyberte kraj" onChange={(e) => setRegion(e.value)} onBlur={() => handleBlur("region")} className={touchedFields.region && errors.region ? "p-invalid" : ""} />
                    {touchedFields.region && errors.region && <small className="p-error">Región je povinný.</small>}
                </div>

                <div className="p-field">
                    <label htmlFor="email">Email</label>
                    <InputText id="email" value={email} placeholder="Email" onChange={(e) => setEmail(e.target.value)} onBlur={() => handleBlur("email")} tooltip="Allowed email domains: @student.ukf.sk, @gmail.com" className={touchedFields.email && errors.email ? "p-invalid" : ""} />
                    {touchedFields.email && errors.email && <small className="p-error">Valid email is required.</small>}
                </div>

                <div className="p-field password-field">
                    <label htmlFor="password">Heslo</label>
                    <div className="password-toggle">
                        <InputText id="password" type={showPassword ? "text" : "password"} value={password} placeholder="Heslo" onChange={(e) => setPassword(e.target.value)} onBlur={() => handleBlur("password")} className={touchedFields.password && errors.password ? "p-invalid" : ""} />
                        <span className="toggle-icon" onClick={() => setShowPassword((prev) => !prev)}>
                            {showPassword ? <PiEyeSlash /> : <PiEye />}
                        </span>
                    </div>
                    {touchedFields.password && errors.password && (
                        <small className="p-error">
                            Heslo musí obsahovať aspoň 6 písmen a 4 čísla.
                        </small>
                    )}
                </div>

                <div className="p-field password-field">
                    <label htmlFor="confirmPassword">Potvrď heslo</label>
                    <div className="password-toggle">
                        <InputText id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} placeholder="Zopakuj heslo" onChange={(e) => setConfirmPassword(e.target.value)} onBlur={() => handleBlur("confirmPassword")} className={touchedFields.confirmPassword && password !== confirmPassword ? "p-invalid" : ""} />
                        <span className="toggle-icon" onClick={() => setShowConfirmPassword((prev) => !prev)}>
                            {showConfirmPassword ? <PiEyeSlash /> : <PiEye />}
                        </span>
                    </div>
                    {touchedFields.confirmPassword && password !== confirmPassword && <small className="p-error">Heslá sa nezhodujú.</small>}
                </div>

                <div className="button-group">
                    <Button label="Registrovať sa" icon="pi pi-user" onClick={handleRegister} className="p-button-success button-spacing" />
                    <Button label="Zrušiť" icon="pi pi-times" onClick={() => navigate("/api/login")} className="p-button-secondary" />
                </div>
            </Panel>
        </div>
    );
}
