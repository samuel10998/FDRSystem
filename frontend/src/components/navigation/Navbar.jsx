import React, { useEffect, useState } from "react";
import { Menubar } from "primereact/menubar";
import { Button } from "primereact/button";
import { useNavigate, useLocation } from "react-router-dom";
import "./navbar.css";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 min
const CHECK_EVERY_MS = 15 * 1000;       // 15s
const ACTIVITY_EVENTS = ["click", "keydown", "mousemove", "scroll", "touchstart"];

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [showMenu, setShowMenu] = useState(false);
    const [, forceRender] = useState(0);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("user")) || { roles: [] };
        } catch (e) {
            console.error("Error reading user from localStorage:", e);
            return { roles: [] };
        }
    };

    const clearAuthStorage = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("tokenExpiration");
        localStorage.removeItem("lastActivityAt");
        window.dispatchEvent(new Event("auth-changed"));
    };

    const roleNames = (getUser().roles || []).map((r) => r.name);
    const isAdmin = roleNames.includes("ROLE_ADMIN");
    const isUser = roleNames.includes("ROLE_USER");
    const token = localStorage.getItem("jwtToken");

    const items = [
        { label: "Domov", icon: "pi pi-home", command: () => navigate("/home"), visible: true },
        { label: "Moje lety", icon: "pi pi-send", command: () => navigate("/my-flights"), visible: isAdmin || isUser },
        { label: "Nahrať súbory", icon: "pi pi-folder", command: () => navigate("/upload-files"), visible: isAdmin || isUser },
        { label: "Moje zariadenia", icon: "pi pi-tablet", command: () => navigate("/my-devices"), visible: isAdmin || isUser },
        { label: "Spravovať používateľov", icon: "pi pi-cog", command: () => navigate("/manage-users"), visible: isAdmin },
        { label: "Manage devices", icon: "pi pi-wrench", command: () => navigate("/admin-devices"), visible: isAdmin },
        { label: "Info", icon: "pi pi-info-circle", command: () => navigate("/info"), visible: !isAdmin },
        { label: "Kontakt", icon: "pi pi-phone", command: () => navigate("/contact"), visible: !isAdmin }
    ];

    const logout = () => {
        clearAuthStorage();
        setShowMenu(false);
        navigate("/api/login");
    };

    const toggleMenu = () => setShowMenu((p) => !p);

    const editProfile = () => {
        const id = getUser()?.id;
        if (id) {
            setShowMenu(false);
            navigate(`/edit-user/${id}`, { state: { backgroundLocation: location } });
        }
    };

    useEffect(() => {
        const onAuthChanged = () => forceRender((v) => v + 1);
        const onStorage = (e) => {
            if (!e.key || ["jwtToken", "user", "tokenExpiration", "lastActivityAt"].includes(e.key)) {
                forceRender((v) => v + 1);
            }
        };

        window.addEventListener("auth-changed", onAuthChanged);
        window.addEventListener("storage", onStorage);

        return () => {
            window.removeEventListener("auth-changed", onAuthChanged);
            window.removeEventListener("storage", onStorage);
        };
    }, []);

    useEffect(() => {
        if (!token) return;

        const markActivity = () => {
            localStorage.setItem("lastActivityAt", String(Date.now()));
        };

        if (!localStorage.getItem("lastActivityAt")) {
            markActivity();
        }

        const check = () => {
            const now = Date.now();
            const lastActivityAt = Number(localStorage.getItem("lastActivityAt") || 0);
            const exp = Number(localStorage.getItem("tokenExpiration") || 0);

            // 1) hard JWT expiry from backend
            if (exp && now >= exp) {
                logout();
                return;
            }

            // 2) inactivity timeout
            if (lastActivityAt && now - lastActivityAt >= IDLE_TIMEOUT_MS) {
                logout();
            }
        };

        ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActivity, { passive: true }));
        const id = setInterval(check, CHECK_EVERY_MS);
        check();

        return () => {
            ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, markActivity));
            clearInterval(id);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const end = (
        <div className="user-info">
            {token ? (
                <div className="user-dropdown">
                    <Button
                        label={`${getUser().name} ${getUser().surname}`}
                        icon="pi pi-user"
                        className="user-button"
                        onClick={toggleMenu}
                    />
                    {showMenu && (
                        <div className="dropdown-menu">
                            <button onClick={editProfile} className="dropdown-item">
                                Upraviť profil
                            </button>
                            <button onClick={logout} className="dropdown-item">
                                Odhlásiť sa
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <Button
                    label="Prihlásenie"
                    icon="pi pi-sign-in"
                    className="p-button-success"
                    onClick={() => navigate("/api/login")}
                />
            )}
        </div>
    );

    return (
        <div className="navbar">
            <Menubar model={items} end={end} />
        </div>
    );
}
