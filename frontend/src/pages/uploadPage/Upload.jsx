import { useState, useEffect } from "react";
import api from "../../api";
import "./upload.css";

export default function Upload() {
    const [token, setToken] = useState(() => localStorage.getItem("jwtToken"));
    const [file, setFile] = useState(null);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        const listener = () => setToken(localStorage.getItem("jwtToken"));
        window.addEventListener("storage", listener);
        return () => window.removeEventListener("storage", listener);
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return setMsg("Vyber súbor.");
        if (!token) return setMsg("Nie si prihlásený.");

        try {
            const data = new FormData();
            data.append("file", file);

            await api.post("/api/flights", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setMsg("✅ Súbor bol úspešne nahratý.");
            setFile(null);
        } catch (err) {
            console.error(err);
            setMsg("❌ Chyba pri nahrávaní.");
        }
    };

    return (
        <div className="upload-page">
            <div className="upload-card">
                <div className="upload-container">
                    <div className="upload-image">
                        <img
                            src="https://th-thumbnailer.cdn-si-edu.com/3ntDdcSfIWsKCH8HCC06vuuG1VY=/fit-in/1600x0/https://tf-cmsv2-smithsonianmag-media.s3.amazonaws.com/filer/2f/c2/2fc2e46b-2936-4f01-bbcf-315e37c76792/02z_fm2021_abstractairliner_678665749_live.jpg"
                            alt="Aviation banner"
                        />
                    </div>

                    <div className="upload-form">
                        <h2 className="upload-title">Nahrať letový súbor</h2>

                        <form onSubmit={handleUpload}>
                            <label htmlFor="fileInput" className="file-label">
                                Vyberte .txt súbor
                            </label>
                            <input
                                id="fileInput"
                                type="file"
                                accept=".txt"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="file-input"
                            />

                            <button type="submit" className="btn-upload" disabled={!token}>
                                Upload
                            </button>
                        </form>

                        {msg && <p className="upload-msg">{msg}</p>}
                        {!token && <p className="upload-error">Nie si prihlásený.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
