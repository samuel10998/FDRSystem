import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import "./myFlights.css";

export default function MyFlights() {
    const [flights, setFlights] = useState([]);
    const [filteredFlights, setFilteredFlights] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [minDistance, setMinDistance] = useState("");
    const [maxDistance, setMaxDistance] = useState("");
    const [minRecords, setMinRecords] = useState("");
    const [maxRecords, setMaxRecords] = useState("");
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const navigate = useNavigate();

    useEffect(() => {
        let alive = true;

        api.get("/api/flights")
            .then((res) => {
                if (alive) {
                    setFlights(res.data);
                    setFilteredFlights(res.data);
                }
            })
            .catch((err) => console.error("GET /api/flights →", err?.response?.status))
            .finally(() => alive && setLoading(false));

        api.get("/api/users/me")
            .then((res) => {
                const userId = res.data.id;
                return api.get(`/api/users/${userId}/analytics`);
            })
            .then((res) => {
                if (alive) setAnalytics(res.data);
            })
            .catch((err) => console.error("GET /api/users/{id}/analytics →", err?.response?.status));

        return () => { alive = false; };
    }, []);

    useEffect(() => {
        const filtered = flights.filter((f) => {
            const matchesName = f.name.toLowerCase().includes(searchTerm.toLowerCase());

            const distance = f.distanceKm ?? 0;
            const recordCount = f.recordCount ?? 0;

            const withinDistance =
                (!minDistance || distance >= parseFloat(minDistance)) &&
                (!maxDistance || distance <= parseFloat(maxDistance));

            const withinRecords =
                (!minRecords || recordCount >= parseInt(minRecords)) &&
                (!maxRecords || recordCount <= parseInt(maxRecords));

            return matchesName && withinDistance && withinRecords;
        });

        setFilteredFlights(filtered);
        setCurrentPage(1);
    }, [searchTerm, minDistance, maxDistance, minRecords, maxRecords, flights]);

    async function handleDelete(id) {
        if (!window.confirm("Naozaj zmazať tento let?")) return;
        try {
            setDeletingId(id);
            await api.delete(`/api/flights/${id}`);
            const updated = flights.filter((f) => f.id !== id);
            setFlights(updated);
            setFilteredFlights(updated);
        } catch (err) {
            console.error("DELETE /api/flights/", id, "→", err?.response?.status);
            alert("Zmazanie zlyhalo.");
        } finally {
            setDeletingId(null);
        }
    }

    function handleDetail(id) {
        navigate(`/flights/${id}`);
    }

    const totalPages = Math.ceil(filteredFlights.length / itemsPerPage);
    const pageFlights = filteredFlights.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    function handlePageChange(e) {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 1 && value <= totalPages) {
            setCurrentPage(value);
        }
    }

    return (
        <section className="my-flights">
            <h2>Moje lety</h2>

            {analytics && (
                <div className="analytics-summary">
                    <h3>📊 Štatistiky používateľa</h3>
                    <p><strong>Počet letov:</strong> {analytics.totalFlights}</p>
                    <p><strong>Počet kilometrov:</strong> {analytics.totalDistanceKm?.toFixed(2)} km</p>
                    <p><strong>Priemerné trvanie letu:</strong> {Math.round(analytics.averageDurationSeconds / 60)} minút</p>
                </div>
            )}

            <div className="card">
                <div className="filters">
                    <input
                        type="text"
                        placeholder="🔍 Hľadať podľa názvu letu…"
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <div className="filter-group">
                        <label><strong>Vzdialenosť (km):</strong></label>
                        <input
                            type="number"
                            placeholder="min(km):"
                            value={minDistance}
                            onChange={(e) => setMinDistance(e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="max(km):"
                            value={maxDistance}
                            onChange={(e) => setMaxDistance(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label><strong>Počet záznamov:</strong></label>
                        <input
                            type="number"
                            placeholder="min:"
                            value={minRecords}
                            onChange={(e) => setMinRecords(e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="max:"
                            value={maxRecords}
                            onChange={(e) => setMaxRecords(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <p className="loading">Načítavam…</p>
                ) : filteredFlights.length === 0 ? (
                    <p className="no-data">Žiadne lety.</p>
                ) : (
                    <>
                        <table className="flights-table">
                            <thead>
                            <tr>
                                <th>Názov</th>
                                <th>Začiatok</th>
                                <th>Koniec</th>
                                <th>Vzdialenosť</th>
                                <th># záznamov</th>
                                <th>Akcia</th>
                            </tr>
                            </thead>
                            <tbody>
                            {pageFlights.map((f) => (
                                <tr key={f.id}>
                                    <td>{f.name}</td>
                                    <td>{new Date(f.startTime).toLocaleString()}</td>
                                    <td>{new Date(f.endTime).toLocaleString()}</td>
                                    <td>
                                        {typeof f.distanceKm === "number"
                                            ? `${f.distanceKm.toFixed(2)} km`
                                            : "—"}
                                    </td>
                                    <td style={{ verticalAlign: "middle", whiteSpace: "nowrap" }}>
                                        {f.recordCount}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleDetail(f.id)}
                                            className="detail-button"
                                        >
                                            Detaily
                                        </button>{" "}
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

                        <div className="pagination">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Späť
                            </button>
                            <span>
                                Strana {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Ďalej
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                            >
                                Posledná
                            </button>
                            <input
                                type="number"
                                min="1"
                                max={totalPages}
                                placeholder="Choď na stranu"
                                onChange={handlePageChange}
                                style={{ width: "100px", marginLeft: "10px" }}
                            />
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
