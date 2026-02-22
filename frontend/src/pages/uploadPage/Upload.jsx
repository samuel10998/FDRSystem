import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import "./upload.css";

export default function Upload() {
    const [token, setToken] = useState(() => localStorage.getItem("jwtToken"));
    const [file, setFile] = useState(null);
    const [msg, setMsg] = useState("");
    const [uploading, setUploading] = useState(false);

    // ✅ cloud sync
    const [syncMsg, setSyncMsg] = useState("");
    const [syncing, setSyncing] = useState(false);

    const navigate = useNavigate();

    // ✅ tvoj route
    const MY_FLIGHTS_ROUTE = "/my-flights";

    useEffect(() => {
        const listener = () => setToken(localStorage.getItem("jwtToken"));
        window.addEventListener("storage", listener);
        return () => window.removeEventListener("storage", listener);
    }, []);

    function buildBackendErrorMessage(err) {
        const data = err?.response?.data;

        if (!data) return "❌ Chyba pri nahrávaní.";

        // backend môže vrátiť string
        if (typeof data === "string") return data;

        const base =
            data.message ||
            data.error ||
            (err?.response?.status ? `❌ Upload zlyhal (HTTP ${err.response.status}).` : "❌ Upload zlyhal.");

        const details = data.details || data;

        const parts = [];

        const firstBadLineNumber = details?.firstBadLineNumber;
        const firstBadLinePreview = details?.firstBadLinePreview;
        const firstBadLineReason = details?.firstBadLineReason;
        const badLines = details?.badLines;

        if (typeof badLines === "number" && badLines > 0) parts.push(`Chybné riadky: ${badLines}`);
        if (firstBadLineNumber != null) parts.push(`Prvý zlý riadok: #${firstBadLineNumber}`);
        if (firstBadLineReason) parts.push(`Dôvod: ${firstBadLineReason}`);
        if (firstBadLinePreview) parts.push(`Ukážka: ${firstBadLinePreview}`);

        if (parts.length === 0) return base;
        return `${base}\n\n${parts.join("\n")}`;
    }

    // ✅ rozparsuje msg na title + detaily + ukážku (pre krajší dizajn)
    const parsedMsg = useMemo(() => {
        if (!msg) return null;

        const [titleRaw, detailsRaw] = msg.split("\n\n");
        const title = (titleRaw || "").trim();

        const lines = (detailsRaw || "")
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);

        const previewLine = lines.find((l) => l.toLowerCase().startsWith("ukážka:"));
        const preview = previewLine ? previewLine.replace(/^Ukážka:\s*/i, "") : null;

        const detailLines = lines.filter((l) => !l.toLowerCase().startsWith("ukážka:"));

        return {
            title,
            detailLines,
            preview,
        };
    }, [msg]);

    const handleCloudSync = async () => {
        if (!token) {
            setSyncMsg("Nie si prihlásený.");
            return;
        }

        setSyncing(true);
        setSyncMsg("");

        try {
            const devRes = await api.get("/api/devices/my");
            const devData = devRes.data;
            const devices = Array.isArray(devData) ? devData : (devData ? [devData] : []);

            if (devices.length === 0) {
                setSyncMsg("Nemáš žiadne spárované zariadenie.");
                return;
            }

            // MVP: vezmeme prvé zariadenie
            const deviceId = devices[0].deviceId;

            const res = await api.post("/api/cloud/sync", { deviceId });
            const r = res.data || {};

            setSyncMsg(`✅ Sync hotový (${deviceId}) | Imported: ${r.imported ?? 0} | Skipped: ${r.skipped ?? 0}`);
        } catch (err) {
            console.error(err);
            const text =
                err?.response?.data?.message ||
                err?.response?.data ||
                `Sync zlyhal (HTTP ${err?.response?.status || "?"}).`;
            setSyncMsg(String(text));
        } finally {
            setSyncing(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!file) return setMsg("Vyber súbor.");
        if (!token) return setMsg("Nie si prihlásený.");

        const name = file.name?.toLowerCase?.() || "";
        const isTxt = name.endsWith(".txt");
        const isCsv = name.endsWith(".csv");

        if (!isTxt && !isCsv) {
            return setMsg("Prosím vyber .txt alebo .csv súbor.");
        }

        setUploading(true);
        setMsg("");

        try {
            const data = new FormData();
            data.append("file", file);

            const res = await api.post("/api/flights", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const r = res?.data || {};
            const flightName = r?.flight?.name || file.name;

            const recordsSaved = typeof r?.recordsSaved === "number" ? r.recordsSaved : null;
            const badLines = typeof r?.badLines === "number" ? r.badLines : 0;

            let successMsg = `✅ Súbor bol úspešne nahratý: ${flightName}`;
            if (recordsSaved != null) successMsg += `\nUložené záznamy: ${recordsSaved}`;
            if (badLines > 0) {
                successMsg += `\nChybné riadky: ${badLines}`;
                if (r?.firstBadLineNumber != null) successMsg += `\nPrvý zlý riadok: #${r.firstBadLineNumber}`;
                if (r?.firstBadLineReason) successMsg += `\nDôvod: ${r.firstBadLineReason}`;
            }

            setFile(null);

            // ✅ redirect na MyFlights + flash message
            navigate(MY_FLIGHTS_ROUTE, {
                state: {
                    flash: {
                        type: badLines > 0 ? "warn" : "success",
                        message: successMsg,
                    },
                },
            });
        } catch (err) {
            console.error(err);
            setMsg(buildBackendErrorMessage(err));
        } finally {
            setUploading(false);
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
                                Vyberte .txt alebo .csv súbor
                            </label>
                            <input
                                id="fileInput"
                                type="file"
                                accept=".txt,.csv"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="file-input"
                            />

                            {/* ✅ Cloud sync */}
                            <button
                                type="button"
                                className="btn-upload btn-sync"
                                onClick={handleCloudSync}
                                disabled={!token || syncing}
                                title={!token ? "Najprv sa prihlás." : syncing ? "Syncujem…" : "Sync z cloudu"}
                                style={{ background: "#1f4069" }}
                            >
                                {syncing ? "Syncujem…" : "Sync z cloudu"}
                            </button>

                            {syncMsg && <p className="upload-msg">{syncMsg}</p>}

                            <button
                                type="submit"
                                className="btn-upload btn-uploadMain"
                                disabled={!token || uploading}
                                title={!token ? "Najprv sa prihlás." : uploading ? "Nahrávam…" : "Upload"}
                            >
                                {uploading ? "Nahrávam…" : "Upload"}
                            </button>
                        </form>

                        {/* ✅ krajší dizajn pre správu */}
                        {parsedMsg?.title && (
                            <div className="upload-alert upload-alert--error">
                                <div className="upload-alertTitle">{parsedMsg.title}</div>

                                {(parsedMsg.detailLines?.length > 0 || parsedMsg.preview) && (
                                    <details className="upload-alertDetails" open>
                                        <summary>Detaily</summary>

                                        {parsedMsg.detailLines?.length > 0 && (
                                            <ul className="upload-alertList">
                                                {parsedMsg.detailLines.map((line, i) => (
                                                    <li key={i}>{line}</li>
                                                ))}
                                            </ul>
                                        )}

                                        {parsedMsg.preview && (
                                            <div className="upload-alertPreview">
                                                <div className="upload-alertPreviewLabel">Ukážka riadku</div>
                                                <code>{parsedMsg.preview}</code>
                                            </div>
                                        )}
                                    </details>
                                )}
                            </div>
                        )}

                        {!token && <p className="upload-error">Nie si prihlásený.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}