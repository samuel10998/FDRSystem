import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toast } from "primereact/toast";
import "./editUser.css";

export default function EditUserDialog() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useRef(null);

    const [firstName, setFirstName] = useState("");
    const [lastName,  setLastName]  = useState("");
    const [email,     setEmail]     = useState("");
    const [password,  setPassword]  = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        axios
            .get(`http://localhost:8080/api/users/${id}`)
            .then(({ data }) => {
                setFirstName(data.name  || "");
                setLastName( data.surname || "");
                setEmail(    data.email   || "");
            })
            .catch(() =>
                toast.current.show({
                    severity: "error",
                    summary: "Chyba",
                    detail: "Nepodarilo sa načítať údaje používateľa.",
                    life: 4000,
                })
            );
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
                name:    firstName,
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

            // optionally refetch or update parent
            setTimeout(() => navigate("/my-flights"), 1500);
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
            <Toast ref={toast} position="top-right" />
            <section className="edit-user-page">
                <div className="edit-user-card">
                    <div className="edit-user-image">
                        <img
                            src="https://img.freepik.com/premium-photo/portrait-young-pilot-front-airplane-ai-generated-image_268835-6385.jpg"
                            alt="Profile placebo"
                        />
                    </div>
                    <div className="edit-user-form">
                        <h2>Upraviť profil</h2>
                        <div className="form-group">
                            <label>Meno</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Priezvisko</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email (nemenné)</label>
                            <input type="email" value={email} disabled />
                        </div>
                        <div className="form-group">
                            <label>Nové heslo</label>
                            <input
                                type="password"
                                placeholder="Nepovinné – zadajte nové heslo"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Potvrdiť heslo</label>
                            <input
                                type="password"
                                placeholder="Znovu zadajte nové heslo"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        <div className="form-actions">
                            <button className="btn-save" onClick={handleSave}>
                                Uložiť
                            </button>
                            <button className="btn-cancel" onClick={() => navigate(-1)}>
                                Zrušiť
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
