import { useState, useEffect } from 'react';
import axios from 'axios';
import './upload.css';

const API_URL = 'http://localhost:8080';

export default function Upload() {
    const [token, setToken] = useState(() => localStorage.getItem('jwtToken'));
    useEffect(() => {
        const listener = () => setToken(localStorage.getItem('jwtToken'));
        window.addEventListener('storage', listener);
        return () => window.removeEventListener('storage', listener);
    }, []);

    const [file, setFile] = useState(null);
    const [msg, setMsg] = useState('');

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file)  return setMsg('Vyber súbor.');
        if (!token) return setMsg('Nie si prihlásený.');

        try {
            const data = new FormData();
            data.append('file', file);

            await axios.post(
                `${API_URL}/api/flights`,
                data,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setMsg('✅ Súbor bol úspešne nahratý.');
            setFile(null);
        } catch (err) {
            console.error(err);
            setMsg('❌ Chyba pri nahrávaní.');
        }
    };

    return (
        <div className="upload-page">
            <div className="upload-card">
                <h2 className="upload-title">Nahrať letový súbor</h2>

                <form onSubmit={handleUpload} className="upload-form">
                    <label htmlFor="fileInput" className="file-label">
                        Vyberte .txt súbor
                    </label>
                    <input
                        id="fileInput"
                        type="file"
                        accept=".txt"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="file-input"
                    />

                    <button
                        type="submit"
                        className="btn-upload"
                        disabled={!token}
                    >
                        Upload
                    </button>
                </form>

                {msg && <p className="upload-msg">{msg}</p>}
                {!token && (
                    <p className="upload-error">
                        Nie si prihlásený.
                    </p>
                )}
            </div>
        </div>
    );
}
