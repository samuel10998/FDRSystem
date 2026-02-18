import { useEffect, useState } from "react";
import api from "../../api";
import "./admindevices.css";

export default function AdminDevices() {
    const [creating, setCreating] = useState(false);
    const [created, setCreated] = useState(null);

    const [loadingReqs, setLoadingReqs] = useState(false);
    const [requests, setRequests] = useState([]);
    const [assigningUserId, setAssigningUserId] = useState(null);

    const [msg, setMsg] = useState("");

    async function loadRequests() {
        setLoadingReqs(true);
        setMsg("");

        try {
            const res = await api.get("/api/admin/users/device-requests");
            const data = res.data;

            // normalize (1 item môže prísť ako object)
            const arr = Array.isArray(data) ? data : (data ? [data] : []);
            setRequests(arr);
        } catch (err) {
            console.error(err);
            const text =
                err?.response?.data?.message ||
                err?.response?.data ||
                `Nepodarilo sa načítať device requests (HTTP ${err?.response?.status || "?"}).`;
            setMsg(String(text));
        } finally {
            setLoadingReqs(false);
        }
    }

    async function createDevice() {
        setCreating(true);
        setMsg("");
        try {
            const res = await api.post("/api/admin/devices");
            setCreated(res.data);
            setMsg("✅ Device vygenerované. Skopíruj deviceKeyPlain do Worker secrets (ukáže sa len raz).");
        } catch (err) {
            console.error(err);
            const text =
                err?.response?.data?.message ||
                err?.response?.data ||
                `Generate device zlyhal (HTTP ${err?.response?.status || "?"}).`;
            setMsg(String(text));
        } finally {
            setCreating(false);
        }
    }

    async function assignDevice(userId) {
        setAssigningUserId(userId);
        setMsg("");
        try {
            const res = await api.post(`/api/admin/users/${userId}/assign-device`);
            setCreated(res.data); // ukážeme výsledok (deviceKeyPlain + pairingCode)
            setMsg(`✅ Zariadenie priradené userovi ${userId}.`);
            await loadRequests();
        } catch (err) {
            console.error(err);
            const text =
                err?.response?.data?.message ||
                err?.response?.data ||
                `Assign zlyhal (HTTP ${err?.response?.status || "?"}).`;
            setMsg(String(text));
        } finally {
            setAssigningUserId(null);
        }
    }

    function copy(text) {
        if (!text) return;
        navigator.clipboard.writeText(String(text));
        setMsg("✅ Skopírované do clipboardu.");
    }

    useEffect(() => {
        loadRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="admindev-page">
            <div className="admindev-header">
                <h2 className="admindev-title">Admin – Devices</h2>

                <div className="admindev-headerActions">
                    <button className="admindev-btn admindev-btn--secondary" onClick={loadRequests} disabled={loadingReqs}>
                        {loadingReqs ? "Načítavam…" : "Refresh requests"}
                    </button>

                    <button className="admindev-btn admindev-btn--primary" onClick={createDevice} disabled={creating}>
                        {creating ? "Generujem…" : "Generate device"}
                    </button>
                </div>
            </div>

            {msg && <pre className="admindev-msg">{msg}</pre>}

            {/* Generated / assigned result */}
            {created && (
                <div className="admindev-card">
                    <div className="admindev-cardTitle">Výstup (skopíruj si to)</div>

                    <div className="admindev-row">
                        <span className="admindev-label">deviceId</span>
                        <span className="admindev-mono">{created.deviceId}</span>
                        <button className="admindev-copy" onClick={() => copy(created.deviceId)}>Copy</button>
                    </div>

                    {"deviceKeyPlain" in created && (
                        <div className="admindev-row">
                            <span className="admindev-label">deviceKeyPlain</span>
                            <span className="admindev-mono">{created.deviceKeyPlain}</span>
                            <button className="admindev-copy" onClick={() => copy(created.deviceKeyPlain)}>Copy</button>
                        </div>
                    )}

                    <div className="admindev-row">
                        <span className="admindev-label">pairingCode</span>
                        <span className="admindev-mono">{created.pairingCode}</span>
                        <button className="admindev-copy" onClick={() => copy(created.pairingCode)}>Copy</button>
                    </div>

                    {"email" in created && (
                        <div className="admindev-hint">
                            Priradené pre: <b>{created.email}</b> (userId: {created.userId})
                        </div>
                    )}
                </div>
            )}

            {/* Requests list */}
            <div className="admindev-card">
                <div className="admindev-cardTitle">Používatelia, ktorí potrebujú zariadenie (NEEDS_DEVICE)</div>

                {loadingReqs ? (
                    <p>Načítavam…</p>
                ) : requests.length === 0 ? (
                    <p className="admindev-muted">Žiadne požiadavky.</p>
                ) : (
                    <div className="admindev-reqList">
                        {requests.map((u) => (
                            <div className="admindev-reqItem" key={u.id}>
                                <div className="admindev-reqMain">
                                    <div><b>{u.name} {u.surname}</b> – <span className="admindev-mono">{u.email}</span></div>
                                    <div className="admindev-muted">ID: {u.id} • Region: {u.region}</div>
                                </div>

                                <button
                                    className="admindev-btn admindev-btn--primary"
                                    onClick={() => assignDevice(u.id)}
                                    disabled={assigningUserId === u.id}
                                >
                                    {assigningUserId === u.id ? "Priraďujem…" : "Assign device"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}