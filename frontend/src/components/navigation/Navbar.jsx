import React from 'react';
import { Menubar } from 'primereact/menubar';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';
import './navbar.css';

export default function Navbar() {
    const navigate = useNavigate();

    // Načítanie údajov o používateľovi a tokenu
    const user = JSON.parse(localStorage.getItem('user')) || null; // Ak nie je user, nastav na null
    const token = localStorage.getItem('jwtToken');
    console.log('User roles:', user ? user.roles : 'No user logged in');

    // Extrakcia rolí používateľa
    const roles = user?.roles ? user.roles.map(role => role.name) : [];
    const isAdmin = roles.includes('ROLE_ADMIN');
    const isUser = roles.includes('ROLE_USER');

    // Položky pre navigáciu
    const items = [
        {
            label: 'Domov',
            icon: 'pi pi-home',
            command: () => navigate('/home'),
            visible: true, // Vždy viditeľné
        },
        {
            label: 'Moje lety',
            icon: 'pi pi-send',
            command: () => navigate('/my-flights'),
            visible: isAdmin || isUser, // Viditeľné pre ADMIN alebo USER
        },
        {
            label: 'Nahrať súbory',
            icon: 'pi pi-folder',
            command: () => navigate('/upload-files'),
            visible: isAdmin || isUser, // Viditeľné pre ADMIN alebo USER
        },
        {
            label: 'Spravovať používateľov',
            icon: 'pi pi-cog',
            command: () => navigate('/manage-users'),
            visible: isAdmin, // Viditeľné len pre ADMIN
        },
    ];

    // Funkcia na odhlásenie
    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('jwtToken');
        navigate('/api/login');
    };

    // Renderovanie tlačidla pre prihlásenie/odhlásenie
    const end = (
        <div className="user-info">
            {token ? (
                <>
                    <span className="user-name">{`${user?.name || ''} ${user?.surname || ''}`}</span>
                    <Button
                        label="Odhlásiť sa"
                        icon="pi pi-sign-out"
                        className="p-button-danger p-ml-2"
                        onClick={handleLogout}
                    />
                </>
            ) : (
                <Button
                    label="Prihlásiť sa"
                    icon="pi pi-sign-in"
                    className="p-button-success"
                    onClick={() => navigate('/api/login')}
                />
            )}
        </div>
    );

    // Renderovanie navigačného panelu
    return (
        <div className="navbar">
            <Menubar model={items.filter(item => item.visible)} end={end} />
        </div>
    );
}
