import { useEffect, useState } from "react";
import api from "../../api";
import "./myFlights.css";

export default function MyFlights() {
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    /* ------------ načítanie po mounte ---------------- */
    useEffect(() => {
        let alive = true;

        api.get("/api/flights")
            .then((res) => alive && setFlights(res.data))
            .catch((err) => console.error("GET /api/flights →", err?.response?.status))
            .finally(() => alive && setLoading(false));

        return () => { alive = false; };
    }, []);

    /* ------------ zmazanie letu --------------------- */
    async function handleDelete(id) {
        if (!window.confirm("Naozaj zmazať tento let?")) return;
        try {
            setDeletingId(id);
            await api.delete(`/api/flights/${id}`);
            setFlights((prev) => prev.filter((f) => f.id !== id));
        } catch (err) {
            console.error("DELETE /api/flights/", id, "→", err?.response?.status);
            alert("Zmazanie zlyhalo.");
        } finally {
            setDeletingId(null);
        }
    }

    /* -------------------- UI ------------------------ */
    return (
        <section className="my-flights">
            <h2>Moje lety</h2>

            <div className="card">
                {loading ? (
                    <p className="loading">Načítavam…</p>
                ) : flights.length === 0 ? (
                    <p className="no-data">Žiadne lety.</p>
                ) : (
                    <table className="flights-table">
                        <thead>
                        <tr>
                            <th>Názov</th>
                            <th>Začiatok</th>
                            <th>Koniec</th>
                            <th># záznamov</th>
                            <th>Akcia</th>
                        </tr>
                        </thead>
                        <tbody>
                        {flights.map((f) => (
                            <tr key={f.id}>
                                <td>{f.name}</td>
                                <td>{new Date(f.startTime).toLocaleString()}</td>
                                <td>{new Date(f.endTime).toLocaleString()}</td>
                                <td>{f.recordCount}</td>
                                <td>
                                    <button
                                        onClick={() => handleDelete(f.id)}
                                        disabled={deletingId === f.id}
                                        className="delete-button"
                                    >
                                        {deletingId === f.id ? "Mazanie…" : "🗑"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
}
