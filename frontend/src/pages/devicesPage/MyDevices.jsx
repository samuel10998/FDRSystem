import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./mydevices.css";

export default function MyDevices() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");
    const [syncing, setSyncing] = useState(null);

    // ✅ Pairing UI
    const [pairingCode, setPairingCode] = useState("");
    const [pairing, setPairing] = useState(false);

    // ✅ NEW: per-device show/hide key
    const [showKey, setShowKey] = useState({}); // { [deviceId]: boolean }

    const token = useMemo(() => localStorage.getItem("jwtToken"), []);

    async function load() {
        setLoading(true);
        setMsg("");

        try {
            const res = await api.get("/api/devices/my");
            const data = res.data;

            // backend môže vrátiť list alebo single objekt → normalize na array
            const arr = Array.isArray(data) ? data : (data ? [data] : []);
            setDevices(arr);
        } catch (err) {
            console.error(err);
            const text =
                err?.response?.data?.message ||
                err?.response?.data ||
                `Nepodarilo sa načítať zariadenia (HTTP ${err?.response?.status || "?"}).`;
            setMsg(String(text));
        } finally {
            setLoading(false);
        }
    }

    async function doPair(e) {
        e?.preventDefault?.();
        if (!token) return setMsg("Nie si prihlásený.");
        if (!pairingCode.trim()) return setMsg("Zadaj pairing kód.");

        setPairing(true);
        setMsg("");

        try {
            await api.post("/api/devices/pair", { pairingCode: pairingCode.trim() });
            setMsg("✅ Zariadenie bolo úspešne spárované.");
            setPairingCode("");
            await load();
        } catch (err) {
            console.error(err);
            const text =
                err?.response?.data?.message ||
                err?.response?.data ||
                `Pairing zlyhal (HTTP ${err?.response?.status || "?"}).`;
            setMsg(String(text));
        } finally {
            setPairing(false);
        }
    }

    async function doSync(deviceId) {
        setSyncing(deviceId);
        setMsg("");

        try {
            const res = await api.post("/api/cloud/sync", { deviceId });
            const r = res.data || {};
            setMsg(`✅ Sync hotový pre ${deviceId}\nImported: ${r.imported ?? 0}\nSkipped: ${r.skipped ?? 0}`);
        } catch (err) {
            console.error(err);
            const text =
                err?.response?.data?.message ||
                err?.response?.data ||
                `Sync zlyhal (HTTP ${err?.response?.status || "?"}).`;
            setMsg(String(text));
        } finally {
            setSyncing(null);
        }
    }

    async function copyToClipboard(text, label = "Skopírované") {
        try {
            await navigator.clipboard.writeText(String(text));
            setMsg(`✅ ${label}`);
        } catch (e) {
            // fallback
            try {
                const ta = document.createElement("textarea");
                ta.value = String(text);
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
                setMsg(`✅ ${label}`);
            } catch (err) {
                setMsg("❌ Nepodarilo sa skopírovať do clipboardu.");
            }
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="mydevices-page">
            <div className="mydevices-header">
                <h2 className="mydevices-title">Moje zariadenia</h2>
                <button className="mydevices-btn mydevices-btn--secondary" onClick={load} disabled={loading}>
                    {loading ? "Načítavam…" : "Refresh"}
                </button>
            </div>

            {!token && <p className="mydevices-error">Nie si prihlásený.</p>}

            {/* Pairing panel */}
            <div className="mydevices-panel">
                <div className="mydevices-panelTitle">Spárovať zariadenie</div>
                <div className="mydevices-panelHelp">
                    Zadaj pairing kód, ktorý ti dal admin (napr. <code>PAIR_abcd1234</code>).
                </div>

                <form className="mydevices-pairForm" onSubmit={doPair}>
                    <input
                        className="mydevices-input"
                        value={pairingCode}
                        onChange={(e) => setPairingCode(e.target.value)}
                        placeholder="PAIR_..."
                        disabled={!token || pairing}
                    />
                    <button
                        className="mydevices-btn mydevices-btn--primary"
                        type="submit"
                        disabled={!token || pairing}
                        title={!token ? "Najprv sa prihlás." : ""}
                    >
                        {pairing ? "Párujem…" : "Spárovať"}
                    </button>
                </form>
            </div>

            {loading && <p className="mydevices-loading">Načítavam…</p>}

            {msg && <pre className="mydevices-msg">{msg}</pre>}

            {!loading && devices.length === 0 && (
                <p className="mydevices-empty">
                    Zatiaľ nemáš žiadne spárované zariadenie.
                </p>
            )}

            {!loading && devices.length > 0 && (
                <div className="mydevices-grid">
                    {devices.map((d) => {
                        const keyVisible = !!showKey[d.deviceId];
                        const keyValue = d.deviceKeyPlain; // backend ti to teraz pošle

                        return (
                            <div className="mydevices-card" key={d.id || d.deviceId}>
                                <div className="mydevices-row">
                                    <span className="mydevices-label">Device ID:</span>
                                    <span className="mydevices-value">{d.deviceId}</span>
                                    <button
                                        type="button"
                                        className="mydevices-btn mydevices-btn--secondary mydevices-btn--tiny"
                                        onClick={() => copyToClipboard(d.deviceId, "Device ID skopírované")}
                                        title="Copy"
                                    >
                                        Copy
                                    </button>
                                </div>

                                <div className="mydevices-row">
                                    <span className="mydevices-label">Paired at:</span>
                                    <span className="mydevices-value">{d.pairedAt || "—"}</span>
                                </div>

                                {/* ✅ NEW: device key */}
                                <div className="mydevices-row">
                                    <span className="mydevices-label">Device key:</span>

                                    {keyValue ? (
                                        <>
                                            <span className="mydevices-value" style={{ fontFamily: "monospace" }}>
                                                {keyVisible ? keyValue : "••••••••••••••••••••••••••••••••"}
                                            </span>

                                            <button
                                                type="button"
                                                className="mydevices-btn mydevices-btn--secondary mydevices-btn--tiny"
                                                onClick={() =>
                                                    setShowKey((prev) => ({
                                                        ...prev,
                                                        [d.deviceId]: !prev[d.deviceId],
                                                    }))
                                                }
                                            >
                                                {keyVisible ? "Hide" : "Show"}
                                            </button>

                                            <button
                                                type="button"
                                                className="mydevices-btn mydevices-btn--secondary mydevices-btn--tiny"
                                                onClick={() => copyToClipboard(keyValue, "Device key skopírovaný")}
                                                title="Copy"
                                            >
                                                Copy
                                            </button>
                                        </>
                                    ) : (
                                        <span className="mydevices-value">
                                            —
                                            <span style={{ marginLeft: 8, color: "#666" }}>
                                                (nie je dostupný pre staré zariadenia)
                                            </span>
                                        </span>
                                    )}
                                </div>

                                <div className="mydevices-actions">
                                    <button
                                        className="mydevices-btn mydevices-btn--primary"
                                        onClick={() => doSync(d.deviceId)}
                                        disabled={!token || syncing === d.deviceId}
                                        title={!token ? "Najprv sa prihlás." : ""}
                                    >
                                        {syncing === d.deviceId ? "Syncujem…" : "Sync z cloudu"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}