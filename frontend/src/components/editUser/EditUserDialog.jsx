import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import "./editUser.css";

export default function EditUserDialog({ isModal = false }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useRef(null);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [region, setRegion] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [file, setFile] = useState(null);

    const regionOptions = [
        { label: "Bratislavský kraj", value: "Bratislavský kraj" },
        { label: "Trnavský kraj", value: "Trnavský kraj" },
        { label: "Trenčiansky kraj", value: "Trenčiansky kraj" },
        { label: "Nitriansky kraj", value: "Nitriansky kraj" },
        { label: "Žilinský kraj", value: "Žilinský kraj" },
        { label: "Banskobystrický kraj", value: "Banskobystrický kraj" },
        { label: "Prešovský kraj", value: "Prešovský kraj" },
        { label: "Košický kraj", value: "Košický kraj" },
    ];

    // ✅ Relatívna URL pre avatar (funguje s proxy aj mimo Dockeru)
    // img request nejde cez axios interceptor, ale cez proxy pôjde správne:
    // http://localhost:3000/api/...  -> proxy -> backend
    const avatarUrl = id ? `/api/users/${id}/avatar` : "";

    useEffect(() => {
        if (!id) return;

        api
            .get(`/api/users/${id}`)
            .then(({ data }) => {
                setFirstName(data.name || "");
                setLastName(data.surname || "");
                setEmail(data.email || "");
                setRegion(data.region || "");
            })
            .catch(() =>
                toast.current?.show({
                    severity: "error",
                    summary: "Chyba",
                    detail: "Nepodarilo sa načítať údaje používateľa.",
                    life: 4000,
                })
            );
    }, [id]);

    const isPasswordValid = (pwd) => {
        const letters = (pwd.match(/[A-Za-z]/g) || []).length;
        const digits = (pwd.match(/[0-9]/g) || []).length;
        return letters >= 6 && digits >= 4;
    };

    const handleSave = async () => {
        if (password && password !== confirmPassword) {
            toast.current?.show({
                severity: "warn",
                summary: "Upozornenie",
                detail: "Heslá sa musia zhodovať.",
                life: 3000,
            });
            return;
        }

        if (password && !isPasswordValid(password)) {
            toast.current?.show({
                severity: "error",
                summary: "Neplatné heslo",
                detail: "Heslo musí obsahovať aspoň 6 písmen a 4 čísla.",
                life: 4000,
            });
            return;
        }

        try {
            const payload = {
                name: firstName,
                surname: lastName,
                region: region,
                ...(password.trim() && { password }),
            };

            // ✅ cez api (JWT sa pridá automaticky interceptorom)
            await api.patch(`/api/users/${id}`, payload);

            if (file) {
                const formData = new FormData();
                formData.append("file", file);

                // ✅ tiež cez api + multipart
                await api.post(`/api/users/${id}/avatar`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            toast.current?.show({
                severity: "success",
                summary: "Úspech",
                detail: "Zmeny boli úspešne uložené.",
                life: 2500,
            });

            // ✅ Update localStorage user → navbar sa zmení bez re-loginu
            try {
                const lsUser = JSON.parse(localStorage.getItem("user") || "{}");
                if (lsUser && String(lsUser.id) === String(id)) {
                    const updated = { ...lsUser, name: firstName, surname: lastName, region: region };
                    localStorage.setItem("user", JSON.stringify(updated));
                    window.dispatchEvent(new Event("userUpdated"));
                }
            } catch (e) {
                // ignore
            }

            if (isModal) {
                setTimeout(() => navigate(-1), 900);
            } else {
                setTimeout(() => navigate("/my-flights"), 1500);
            }
        } catch (err) {
            toast.current?.show({
                severity: "error",
                summary: "Chyba",
                detail: err.response?.data || "Zlyhala aktualizácia.",
                life: 4000,
            });
        }
    };

    return (
        <>
            <Toast ref={toast} position="top-right" />
            <section className={`edit-user-page ${isModal ? "is-modal" : ""}`}>
                <div className="edit-user-card">
                    <div className="edit-user-image">
                        <img className="avatar" src={avatarUrl} alt="Profilová fotka" />
                    </div>

                    <form
                        className="edit-user-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSave();
                        }}
                    >
                        <h2>Upraviť profil</h2>

                        <div className="form-group">
                            <label>Meno</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                autoComplete="given-name"
                                name="firstName"
                            />
                        </div>

                        <div className="form-group">
                            <label>Priezvisko</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                autoComplete="family-name"
                                name="lastName"
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
                            <input type="email" value={email} disabled autoComplete="email" name="email" />
                        </div>

                        <div className="form-group">
                            <label>Nové heslo</label>
                            <input
                                type="password"
                                placeholder="Nepovinné – zadajte nové heslo"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                name="newPassword"
                            />
                        </div>

                        <div className="form-group">
                            <label>Potvrdiť heslo</label>
                            <input
                                type="password"
                                placeholder="Znovu zadajte nové heslo"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                                name="confirmNewPassword"
                            />
                        </div>

                        <div className="form-group">
                            <label>Nová profilová fotka</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                name="avatar"
                            />
                        </div>

                        <div className="form-actions">
                            <button className="btn-save" type="submit">
                                Uložiť
                            </button>

                            <button className="btn-cancel" type="button" onClick={() => navigate(-1)}>
                                Zrušiť
                            </button>
                        </div>
                    </form>
                </div>
            </section>
        </>
    );
}
