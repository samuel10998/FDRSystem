import React, { useState, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import {
    validateFields,
    handleRegisterSubmit,
} from "../../services/handleRegister";
import "./register.css";

export default function Register() {
    const [name, setName]       = useState("");
    const [surname, setSurname] = useState("");
    const [email, setEmail]     = useState("");
    const [password, setPassword] = useState("");
    const [region, setRegion]   = useState("");

    const [touchedFields, setTouchedFields] = useState({
        name: false,
        surname: false,
        email: false,
        password: false,
        region: false
    });

    const navigate = useNavigate();
    const toast    = useRef(null);

    /* ---------- možnosti pre dropdown ---------- */
    const regionOptions = [
        { label: "Bratislavský kraj",   value: "Bratislavský kraj" },
        { label: "Trnavský kraj",       value: "Trnavský kraj" },
        { label: "Trenčiansky kraj",    value: "Trenčiansky kraj" },
        { label: "Nitriansky kraj",     value: "Nitriansky kraj" },
        { label: "Žilinský kraj",       value: "Žilinský kraj" },
        { label: "Banskobystrický kraj",value: "Banskobystrický kraj" },
        { label: "Prešovský kraj",      value: "Prešovský kraj" },
        { label: "Košický kraj",        value: "Košický kraj" }
    ];

    const handleRegister = () => {
        const fields = { name, surname, email, password, region };
        const errors = validateFields(fields);

        if (Object.values(errors).every((error) => !error)) {
            handleRegisterSubmit(fields)
                .then(() => {
                    toast.current.show({
                        severity: "success",
                        summary: "Úspech",
                        detail:  "Úspešná registrácia. Skontrolujte svoj email.",
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
                {/* meno */}
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
                    <label htmlFor="region">Región</label>
                    <Dropdown
                        id="region"
                        value={region}
                        options={regionOptions}
                        placeholder="Vyberte kraj"
                        onChange={(e) => setRegion(e.value)}
                        onBlur={() => handleBlur("region")}
                        className={
                            touchedFields.region && errors.region
                                ? "p-invalid"
                                : ""
                        }
                    />
                    {touchedFields.region && errors.region && (
                        <small className="p-error">Región je povinný.</small>
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
