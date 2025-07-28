// src/pages/uploadPage/Upload.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

/** 👇 ak nechceš .env, daj URL natvrdo tu */
const API_URL = 'http://localhost:8080';     // port backendu

export default function Upload() {
    /* === 1. token reaktívne ==================================== */
    const [token, setToken] = useState(() => localStorage.getItem('jwtToken'));

    /* synchronizácia – keď sa v inom okne/tab‑e odhlásiš/prihlásiš */
    useEffect(() => {
        const listener = () => setToken(localStorage.getItem('jwtToken'));
        window.addEventListener('storage', listener);
        return () => window.removeEventListener('storage', listener);
    }, []);

    /* === 2. výber súboru ======================================= */
    const [file, setFile] = useState(null);
    const [msg,  setMsg]  = useState('');

    /* === 3. odoslanie súboru =================================== */
    const handleUpload = async (e) => {
        e.preventDefault();               // ne‑reloadni stránku

        if (!file)  return setMsg('Vyber súbor.');
        if (!token) return setMsg('Nie si prihlásený.');

        try {
            const data = new FormData();
            data.append('file', file);

            await axios.post(
                `${API_URL}/api/flights`,   // ⟵ plná URL (už nie /api…)
                data,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setMsg('✅ Súbor bol úspešne nahratý.');
            setFile(null);                 // reset vstupu (nepovinné)
        } catch (err) {
            console.error(err);
            setMsg('❌ Chyba pri nahrávaní.');
        }
    };

    /* === 4. UI ================================================= */
    return (
        <div className="upload-page" style={{maxWidth: 600, margin: '0 auto'}}>
            <h2>Nahrať letový súbor</h2>

            <form onSubmit={handleUpload}>
                <input
                    type="file"
                    accept=".txt"
                    onChange={(e) => setFile(e.target.files[0])}
                />

                {/* preventDefault už rieši reload, takže stačí submit btn */}
                <button
                    type="submit"
                    className="btn-upload"
                    style={{display: 'block', width: '100%', marginTop: 16}}
                    disabled={!token}
                >
                    Upload
                </button>
            </form>

            {msg && <p style={{marginTop: 12}}>{msg}</p>}
            {!token && (
                <p style={{color: '#f00', marginTop: 12}}>
                    Nie si prihlásený.
                </p>
            )}
        </div>
    );
}
