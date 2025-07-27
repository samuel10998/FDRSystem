import React, { useEffect, useState } from 'react';
import { Menubar } from 'primereact/menubar';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';
import './navbar.css';

export default function Navbar() {
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);

    const getUserFromLocalStorage = () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            return user && user.roles ? user : { roles: [] };
        } catch (error) {
            console.error("Error reading user from localStorage:", error);
            return { roles: [] };
        }
    };

    const extractRoleNames = (roles) => {
        if (!roles || !Array.isArray(roles)) return [];
        return roles.map(role => role.name);
    };

    const user = getUserFromLocalStorage();
    const token = localStorage.getItem('jwtToken');
    const roleNames = user ? extractRoleNames(user.roles) : [];

    const isAdmin = roleNames.includes('ROLE_ADMIN');
    const isUser = roleNames.includes('ROLE_USER');

    // Položky pre navigáciu
    const items = [
        {
            label: 'Domov',  //pi-phone
            icon: 'pi pi-home',
            command: () => navigate('/home'),
            visible: true, // Vždy viditeľné
        },
        {
            label: 'Moje lety',
            icon: 'pi pi-send',
            command: () => navigate('/my-flights'),
            visible: isAdmin || isUser,
        },
        {
            label: 'Nahrať súbory',
            icon: 'pi pi-folder',
            command: () => navigate('/upload-files'),
            visible: isAdmin || isUser,
        },
        {
            label: 'Spravovať používateľov',
            icon: 'pi pi-cog',
            command: () => navigate('/manage-users'),
            visible: isAdmin,
        },
        {
            label: 'Info',
            icon: 'pi pi-info-circle',
            command: () => navigate('/info'),
            visible: !isAdmin, //Viditelne pre vsetkych okrem ADMINA (TOTO SOM PRIDAL)
        },
        {
            label: 'Kontakt',
            icon: 'pi pi-phone',
            command: () => navigate('/Contact'),
            visible: !isAdmin,  //Viditelne pre vsetkych okrem ADMINA (TOTO SOM PRIDAL)
        },
    ];

    const handleLogout = () => {
        setShowMenu(false);
        localStorage.removeItem('user');
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('tokenExpiration');
        navigate('/api/login');
    };

    const toggleMenu = () => {
        setShowMenu((prevState) => !prevState);
    };

    const handleEditProfile = () => {
        const userId = user?.id;
        if (userId) {
            setShowMenu(false);
            navigate(`/edit-user/${userId}`);
        } else {
            console.error("User ID is not available.");
        }
    };

    useEffect(() => {
        const checkTokenExpiration = () => {
            const expDate = new Date(localStorage.getItem('tokenExpiration'));
            if (expDate) {
                if (new Date() >= expDate) {
                    handleLogout();
                }
            }
        };

        if (token) {
            const interval = setInterval(checkTokenExpiration, 300000);
            return () => clearInterval(interval);
        }
    }, [token]);

    const end = (
        <div className="user-info">
            {token ? (
                <>
                    <div className="user-dropdown">
                        <Button
                            label={`${user.name} ${user.surname}`}
                            icon="pi pi-user"
                            className="user-button"
                            onClick={toggleMenu}
                        />
                        {showMenu && (
                            <div className="dropdown-menu">
                                <button onClick={handleEditProfile} className="dropdown-item">
                                    Upraviť profil
                                </button>
                                <button onClick={handleLogout} className="dropdown-item">
                                    Odhlásiť sa
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <Button
                    label="Prihlásenie"
                    icon="pi pi-sign-in"
                    className="p-button-success"
                    onClick={() => navigate('/api/login')}
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
