import React, { useState, useEffect, useRef } from "react";
import "./editUser.css";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Toast } from "primereact/toast";

const EditUserDialog = ({ onClose, onUpdate }) => {
    const { id } = useParams();
    const toast = useRef(null);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: userData } = await axios.get(
                    `http://localhost:8080/api/users/${id}`
                );
                setFirstName(userData.name || "");
                setLastName(userData.surname || "");
                setEmail(userData.email || "");
            } catch (err) {
                toast.current.show({
                    severity: "error",
                    summary: "Chyba",
                    detail: "Nepodarilo sa načítať údaje používateľa.",
                    life: 4000,
                });
            }
        };
        fetchData();
    }, [id]);

    const handleSave = async () => {
        if (password && password !== confirmPassword) {
            toast.current.show({
                severity: "warn",
                summary: "Upozornenie",
                detail: "Heslá sa musia zhodovať.",
                life: 3000,
            });
            return;
        }

        try {
            const payload = {
                name: firstName,
                surname: lastName,
                ...(password.trim() && { password }),
            };

            await axios.patch(`http://localhost:8080/api/users/${id}`, payload);

            toast.current.show({
                severity: "success",
                summary: "Úspech",
                detail: "Zmeny boli úspešne uložené.",
                life: 3000,
            });

            onUpdate?.();
            setTimeout(() => onClose?.(), 2000);
        } catch (err) {
            toast.current.show({
                severity: "error",
                summary: "Chyba",
                detail: err.response?.data?.message || "Zlyhala aktualizácia.",
                life: 4000,
            });
        }
    };

    return (
        <>
            {}
            <Toast ref={toast} position="top-right" appendTo={document.body} />

            <div className="edit-user-dialog">
                <div className="dialog-content">
                    <h2>Upraviť profil</h2>

                    <div className="form-group">
                        <label>Meno:</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Priezvisko:</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Email (nemenné):</label>
                        <input type="email" value={email} disabled />
                    </div>

                    <div className="form-group">
                        <label>Nové heslo:</label>
                        <input
                            type="password"
                            placeholder="Nepovinné – zadajte nové heslo"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Potvrdiť heslo:</label>
                        <input
                            type="password"
                            placeholder="Znovu zadajte nové heslo"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <div className="dialog-actions">
                        <button className="btn-save" onClick={handleSave}>
                            Uložiť
                        </button>
                        <button className="btn-cancel" onClick={() => onClose?.()}>
                            Zrušiť
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EditUserDialog;
