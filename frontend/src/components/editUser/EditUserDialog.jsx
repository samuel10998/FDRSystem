import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import "./editUser.css";

export default function EditUserDialog() {
    const { id }  = useParams();
    const navigate = useNavigate();
    const toast    = useRef(null);

    const [firstName, setFirstName] = useState("");
    const [lastName,  setLastName]  = useState("");
    const [email,     setEmail]     = useState("");
    const [region,    setRegion]    = useState("");
    const [profilePic, setProfilePic] = useState("profile_picture_default.jpg"); // default
    const [password,  setPassword]  = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [file, setFile] = useState(null);

    const regionOptions = [
        { label: "Bratislavský kraj",    value: "Bratislavský kraj" },
        { label: "Trnavský kraj",        value: "Trnavský kraj" },
        { label: "Trenčiansky kraj",     value: "Trenčiansky kraj" },
        { label: "Nitriansky kraj",      value: "Nitriansky kraj" },
        { label: "Žilinský kraj",        value: "Žilinský kraj" },
        { label: "Banskobystrický kraj", value: "Banskobystrický kraj" },
        { label: "Prešovský kraj",       value: "Prešovský kraj" },
        { label: "Košický kraj",         value: "Košický kraj" }
    ];

    /* ----------- načítanie údajov ----------- */
    useEffect(() => {
        axios.get(`http://localhost:8080/api/users/${id}`)
            .then(({ data }) => {
                setFirstName(data.name     || "");
                setLastName( data.surname  || "");
                setEmail(     data.email   || "");
                setRegion(    data.region  || "");
                setProfilePic(data.profilePicture || "profile_picture_default.jpg");
            })
            .catch(() =>
                toast.current.show({
                    severity: "error",
                    summary:  "Chyba",
                    detail:   "Nepodarilo sa načítať údaje používateľa.",
                    life: 4000,
                })
            );
    }, [id]);

    /* ----------- uloženie ----------- */
    const handleSave = async () => {
        if (password && password !== confirmPassword) {
            toast.current.show({
                severity: "warn",
                summary:  "Upozornenie",
                detail:   "Heslá sa musia zhodovať.",
                life: 3000,
            });
            return;
        }

        try {
            const payload = {
                name:    firstName,
                surname: lastName,
                region:  region,
                ...(password.trim() && { password })
            };
            await axios.patch(`http://localhost:8080/api/users/${id}`, payload);

            if (file) {
                const formData = new FormData();
                formData.append("file", file);

                await axios.post(
                    `http://localhost:8080/api/users/${id}/avatar`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`
                        }
                    }
                );
            }

            toast.current.show({
                severity: "success",
                summary:  "Úspech",
                detail:   "Zmeny boli úspešne uložené.",
                life: 3000,
            });

            setTimeout(() => navigate("/my-flights"), 1500);
        } catch (err) {
            toast.current.show({
                severity: "error",
                summary:  "Chyba",
                detail:   err.response?.data || "Zlyhala aktualizácia.",
                life: 4000,
            });
        }
    };

    /* ----------- JSX ----------- */
    return (
        <>
            <Toast ref={toast} position="top-right" />
            <section className="edit-user-page">
                <div className="edit-user-card">
                    {/* ľavý panel – fotka v kruhu */}
                    <div className="edit-user-image">
                        <img
                            className="avatar"
                            src={`http://localhost:8080/api/users/${id}/avatar`}
                            alt="Profilová fotka"
                        />
                    </div>

                    {/* pravý panel – formulár */}
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
                            <label>Región</label>
                            <Dropdown
                                value={region}
                                options={regionOptions}
                                onChange={(e) => setRegion(e.value)}
                                placeholder="Vyberte kraj"
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

                        <div className="form-group">
                            <label>Nová profilová fotka</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files[0])}
                            />
                        </div>

                        <div className="form-actions">
                            <button className="btn-save"   onClick={handleSave}>Uložiť</button>
                            <button className="btn-cancel" onClick={() => navigate(-1)}>Zrušiť</button>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}