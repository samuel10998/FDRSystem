import React from 'react';
import { Menubar } from 'primereact/menubar';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';
import './navbar.css';

export default function Navbar() {
    const navigate = useNavigate();

    //user based controll and tokens will work after implementing jwt
    const user = JSON.parse(localStorage.getItem('user'));
    console.log('User roles:', user ? user.roles : 'No user logged in');
    const token = localStorage.getItem('jwtToken');

    const isAdmin = user && user.role.includes('ROLE_ADMIN');
    // const isUser = user && user.role.includes('ROLE_USER');
    //const isHost = user && user.role.includes('ROLE_HOST');

    const items = [
        {
            label: 'Domov',
            icon: 'pi pi-home',
            command: () => navigate('/home'),
            visible: true
        },
        {
            label: 'Moje lety',
            icon: 'pi pi-send',
            command: () => navigate('/my-flights'),
            visible: true
        },
        {
            label: 'Nahrať súbory',
            icon: 'pi pi-folder',
            command: () => navigate('/upload-files'),
            visible: true
        },
        {
            label: 'Spravovať použivateľov',
            icon: 'pi pi-cog',
            command: () => navigate('/manage-users'),
            visible: true
        }
    ];

    if (token) {

        if (isAdmin) {
            items.push({
                label: 'Manage Users',
                icon: 'pi pi-users',
                command: () => navigate('/manage-users'),
                visible: true
            });
        }
    }

    // Logout function
    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('jwtToken');
        navigate('/auth/login');
    };

    // Render the Menubar with navigation items
    const end = (
        <div className="user-info">
            {token ? (
                <>
                    <span className="user-name">{`${user.name} ${user.lastName}`}</span>
                    <Button
                        label="Logout"
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
                    onClick={() => navigate('/auth/login')}
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