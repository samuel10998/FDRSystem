import React, { useState, useEffect } from "react";
import "./editUser.css";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";


const EditUserDialog = ({ onClose, onUpdate }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [userData, setUserData] = useState({});
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState(""); // New password
    const [confirmPassword, setConfirmPassword] = useState(""); // Confirm new password
    const [oldPassword, setOldPassword] = useState(""); // Old password for verification
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userResponse = await axios.get(`http://localhost:8080/api/users/${id}`);

                if (!userResponse) throw new Error("Nepodarilo sa načítať údaje používateľa");

                const userData = await userResponse.data;

                setUserData(userData);
                setFirstName(userData.name || "");
                setLastName(userData.surname || "");
                setEmail(userData.email || "");

            } catch (err) {
                setError(err.message);
            }
        };

        fetchData();
    }, [id]);

    const handleSave = async () => {
        if (password && password !== confirmPassword) {
            setError("Nové heslo a jeho potvrdenie sa nezhodujú.");
            return;
        }

        try {
            const updatedUser = {
                name: firstName,
                surname: lastName,
                email: email,
                password: password.trim() ? password : null // Only include password if provided
            };

            const response = await axios.patch(`http://localhost:8080/api/users/${id}`, updatedUser);

            if (!response) {
                throw new Error("Chyba pri aktualizácii používateľa");
            }

            setSuccessMessage("Zmeny profilu boli úspešne uložené!");
            setTimeout(() => setSuccessMessage(""), 3000);

            onUpdate && onUpdate();
            onClose && onClose();

            if (!sessionStorage.getItem('messageShown')) {
                sessionStorage.setItem('messageShown', 'true');
                navigate("/home", {
                    state: { message: "Údaje používateľa boli úspešne aktualizované!", type: "success" },
                });
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCancel = () => {
        onClose && onClose();
        navigate("/home");
    };

    return (
        <div className="edit-user-dialog">
            <div className="dialog-content">
                <h2>Upraviť používateľa</h2>
                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
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
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        disabled
                    />
                </div>
                <div className="form-group">
                    <label>Nové heslo:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Zadajte nové heslo"
                    />
                </div>
                <div className="form-group">
                    <label>Znovu zadaj nové heslo:</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Znovu zadajte nové heslo"
                    />
                </div>
                <div className="dialog-actions">
                    <button onClick={handleSave}>Uložiť</button>
                    <button onClick={handleCancel}>Zrušiť</button>
                </div>
            </div>
        </div>
    );
};

export default EditUserDialog;
