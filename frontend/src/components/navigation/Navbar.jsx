import React, { useEffect, useState } from "react";
import { Menubar } from "primereact/menubar";
import { Button } from "primereact/button";
import { useNavigate, useLocation } from "react-router-dom"; // ✅ useLocation
import "./navbar.css";

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation(); // ✅ current location (pozadie modalu)
    const [showMenu, setShowMenu] = useState(false);

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("user")) || { roles: [] };
        } catch (e) {
            console.error("Error reading user from localStorage:", e);
            return { roles: [] };
        }
    };

    const roleNames = (getUser().roles || []).map((r) => r.name);
    const isAdmin = roleNames.includes("ROLE_ADMIN");
    const isUser = roleNames.includes("ROLE_USER");
    const token = localStorage.getItem("jwtToken");

    const items = [
        {
            label: "Domov",
            icon: "pi pi-home",
            command: () => navigate("/home"),
            visible: true
        },
        {
            label: "Moje lety",
            icon: "pi pi-send",
            command: () => navigate("/my-flights"),
            visible: isAdmin || isUser
        },
        {
            label: "Nahrať súbory",
            icon: "pi pi-folder",
            command: () => navigate("/upload-files"),
            visible: isAdmin || isUser
        },
        {
            label: "Moje zariadenia",
            icon: "pi pi-tablet",
            command: () => navigate("/my-devices"),
            visible: isAdmin || isUser
        },
        {
            label: "Spravovať používateľov",
            icon: "pi pi-cog",
            command: () => navigate("/manage-users"),
            visible: isAdmin
        },
        {
            label: "Manage devices",
            icon: "pi pi-wrench",
            command: () => navigate("/admin-devices"),
            visible: isAdmin
        },
        {
            label: "Info",
            icon: "pi pi-info-circle",
            command: () => navigate("/info"),
            visible: !isAdmin
        },
        {
            label: "Kontakt",
            icon: "pi pi-phone",
            command: () => navigate("/contact"),
            visible: !isAdmin
        }
    ];

    const logout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("tokenExpiration");
        setShowMenu(false);
        navigate("/api/login");
    };

    const toggleMenu = () => setShowMenu((p) => !p);

    const editProfile = () => {
        const id = getUser()?.id;
        if (id) {
            setShowMenu(false);

            // ✅ otvorí /edit-user/:id ako modal nad aktuálnou stránkou
            navigate(`/edit-user/${id}`, {
                state: { backgroundLocation: location }
            });
        }
    };

    useEffect(() => {
        if (!token) return;

        const check = () => {
            const exp = new Date(localStorage.getItem("tokenExpiration") || 0);
            if (Date.now() >= exp) logout();
        };

        const id = setInterval(check, 300_000); // každých 5 min
        return () => clearInterval(id);
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
