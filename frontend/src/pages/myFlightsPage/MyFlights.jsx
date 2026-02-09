import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [sort, setSort] = useState({ key: null, dir: null });

    // { type: "success"|"error"|"info"|"warn", message: string }
    const [flash, setFlash] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();

    // ✅ flash message from Upload page (navigate state)
    useEffect(() => {
        const f = location?.state?.flash;
        if (f?.message) {
            setFlash({ type: f.type || "info", message: f.message });

            // clear state so it doesn't re-appear on refresh/back
            navigate(location.pathname, { replace: true, state: {} });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ auto-dismiss flash (centralized)
    useEffect(() => {
        if (!flash?.message) return;

        const type = flash.type || "info";
        const ms =
            type === "success" ? 3500 :
                type === "info" ? 4500 :
                    type === "warn" ? 6500 :
                        8000; // error

        const t = setTimeout(() => setFlash(null), ms);
        return () => clearTimeout(t);
    }, [flash]);

    useEffect(() => {
        let alive = true;

        api
            .get("/api/flights")
            .then((res) => {
                if (alive) {
                    setFlights(res.data);
                    setFilteredFlights(res.data);
                }
            })
            .catch((err) => console.error("GET /api/flights →", err?.response?.status))
            .finally(() => alive && setLoading(false));

        return () => {
            alive = false;
        };
    }, []);

    // ✅ Analytics computed from flights
    const analytics = useMemo(() => {
        if (!flights || flights.length === 0) return null;

        const totalFlights = flights.length;

        const totalDistanceKm = flights.reduce((sum, f) => {
            return sum + (typeof f.distanceKm === "number" ? f.distanceKm : 0);
        }, 0);

        let totalDurationSeconds = 0;
        let durationCount = 0;

        for (const f of flights) {
            if (!f?.startTime || !f?.endTime) continue;
            const start = new Date(f.startTime).getTime();
            const end = new Date(f.endTime).getTime();
            if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
                totalDurationSeconds += Math.round((end - start) / 1000);
                durationCount += 1;
            }
        }

        const averageDurationSeconds =
            durationCount > 0 ? Math.round(totalDurationSeconds / durationCount) : 0;

        return {
            totalFlights,
            totalDistanceKm,
            averageDurationSeconds,
        };
    }, [flights]);

    useEffect(() => {
        const filtered = flights.filter((f) => {
            const matchesName = (f.name ?? "").toLowerCase().includes(searchTerm.toLowerCase());

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

            setFlash({ type: "success", message: "Let bol zmazaný.\nZoznam bol aktualizovaný." });
        } catch (err) {
            console.error("DELETE /api/flights/", id, "→", err?.response?.status);
            setFlash({ type: "error", message: "Zmazanie zlyhalo.\nSkús to prosím ešte raz." });
        } finally {
            setDeletingId(null);
        }
    }

    function handleDetail(id) {
        navigate(`/flights/${id}`);
    }

    // toggle sort: off -> asc -> desc -> off
    function toggleSort(key) {
        setSort((prev) => {
            if (prev.key !== key) return { key, dir: "asc" };
            if (prev.dir === "asc") return { key, dir: "desc" };
            return { key: null, dir: null };
        });
        setCurrentPage(1);
    }

    const sortedFlights = useMemo(() => {
        const arr = [...filteredFlights];
        if (!sort.key || !sort.dir) return arr;

        const dirMul = sort.dir === "asc" ? 1 : -1;

        const getVal = (f) => {
            switch (sort.key) {
                case "name":
                    return (f.name ?? "").toLowerCase();
                case "startTime":
                    return f.startTime ? new Date(f.startTime).getTime() : Number.NEGATIVE_INFINITY;
                case "endTime":
                    return f.endTime ? new Date(f.endTime).getTime() : Number.NEGATIVE_INFINITY;
                case "distanceKm":
                    return typeof f.distanceKm === "number" ? f.distanceKm : Number.NEGATIVE_INFINITY;
                case "recordCount":
                    return typeof f.recordCount === "number" ? f.recordCount : Number.NEGATIVE_INFINITY;
                default:
                    return 0;
            }
        };

        arr.sort((a, b) => {
            const av = getVal(a);
            const bv = getVal(b);

            if (typeof av === "string" && typeof bv === "string") {
                return av.localeCompare(bv) * dirMul;
            }
            return (av - bv) * dirMul;
        });

        return arr;
    }, [filteredFlights, sort]);

    const totalPages = Math.max(1, Math.ceil(sortedFlights.length / itemsPerPage));

    const pageFlights = useMemo(() => {
        return sortedFlights.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [sortedFlights, currentPage]);

    function handlePageChange(e) {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 1 && value <= totalPages) {
            setCurrentPage(value);
        }
    }

    const resultsLabel = loading
        ? "Načítavam…"
        : sortedFlights.length === 0
            ? "Žiadne lety."
            : `${sortedFlights.length} výsledkov`;

    function sortIcon(key) {
        if (sort.key !== key || !sort.dir) return <span className="mf-sortIcon">↕</span>;
        return sort.dir === "asc" ? (
            <span className="mf-sortIcon mf-sortIcon--active">↑</span>
        ) : (
            <span className="mf-sortIcon mf-sortIcon--active">↓</span>
        );
    }

    const formatDT = (v) => {
        if (!v) return "—";
        const d = new Date(v);
        return Number.isFinite(d.getTime()) ? d.toLocaleString() : "—";
    };

    // ✅ parse flash message into title + detail lines
    const flashParsed = useMemo(() => {
        if (!flash?.message) return null;
        const lines = String(flash.message)
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);

        const title = lines[0] || "";
        const detailLines = lines.slice(1);

        return { title, detailLines };
    }, [flash]);

    const flashIcon = (type) => {
        switch (type) {
            case "success":
                return "✓";
            case "warn":
                return "!";
            case "error":
                return "×";
            default:
                return "i";
        }
    };

    return (
        <section className="mf-page">
            <div className="mf-report">

                {/* ✅ Flash / Toast */}
                {flashParsed?.title && (
                    <div className={`mf-flash mf-flash--${flash?.type || "info"}`}>
                        <div className="mf-flashIcon" aria-hidden="true">
                            {flashIcon(flash?.type)}
                        </div>

                        <div className="mf-flashBody">
                            <div className="mf-flashTitle">{flashParsed.title}</div>

                            {flashParsed.detailLines?.length > 0 && (
                                <ul className="mf-flashList">
                                    {flashParsed.detailLines.map((line, i) => (
                                        <li key={i}>{line}</li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <button
                            onClick={() => setFlash(null)}
                            className="mf-flashClose"
                            aria-label="Zavrieť"
                            title="Zavrieť"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="mf-header">
                    <div>
                        <div className="mf-titleSmall">Flights</div>
                        <h2 className="mf-title">Moje lety</h2>
                        <div className="mf-sub">{resultsLabel}</div>
                    </div>

                    {analytics && (
                        <div className="mf-kpis">
                            <div className="mf-kpi">
                                <div className="mf-kpiLabel">Počet letov</div>
                                <div className="mf-kpiValue">{analytics.totalFlights}</div>
                            </div>
                            <div className="mf-kpi">
                                <div className="mf-kpiLabel">Počet kilometrov</div>
                                <div className="mf-kpiValue">{analytics.totalDistanceKm.toFixed(2)} km</div>
                            </div>
                            <div className="mf-kpi">
                                <div className="mf-kpiLabel">Priem. trvanie</div>
                                <div className="mf-kpiValue">
                                    {analytics.averageDurationSeconds > 0
                                        ? `${Math.round(analytics.averageDurationSeconds / 60)} min`
                                        : "—"}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="mf-panel">
                    <div className="mf-filters">
                        <div className="mf-field mf-field--full">
                            <label className="mf-label">Vyhľadávanie</label>
                            <input
                                type="text"
                                placeholder="Hľadať podľa názvu letu…"
                                className="mf-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="mf-field">
                            <label className="mf-label">Vzdialenosť (km) – min</label>
                            <input
                                type="number"
                                placeholder="0"
                                className="mf-input"
                                value={minDistance}
                                onChange={(e) => setMinDistance(e.target.value)}
                            />
                        </div>

                        <div className="mf-field">
                            <label className="mf-label">Vzdialenosť (km) – max</label>
                            <input
                                type="number"
                                placeholder="∞"
                                className="mf-input"
                                value={maxDistance}
                                onChange={(e) => setMaxDistance(e.target.value)}
                            />
                        </div>

                        <div className="mf-field">
                            <label className="mf-label">Počet záznamov – min</label>
                            <input
                                type="number"
                                placeholder="0"
                                className="mf-input"
                                value={minRecords}
                                onChange={(e) => setMinRecords(e.target.value)}
                            />
                        </div>

                        <div className="mf-field">
                            <label className="mf-label">Počet záznamov – max</label>
                            <input
                                type="number"
                                placeholder="∞"
                                className="mf-input"
                                value={maxRecords}
                                onChange={(e) => setMaxRecords(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="mf-tableCard">
                    {loading ? (
                        <p className="mf-state">Načítavam…</p>
                    ) : sortedFlights.length === 0 ? (
                        <p className="mf-state">Žiadne lety.</p>
                    ) : (
                        <>
                            <div className="mf-tableWrap">
                                <table className="mf-table">
                                    <thead>
                                    <tr>
                                        <th className="mf-sortable" onClick={() => toggleSort("name")} title="Zoradiť">
                                            <span className="mf-thLabel">Názov</span>
                                            {sortIcon("name")}
                                        </th>

                                        <th className="mf-sortable" onClick={() => toggleSort("startTime")} title="Zoradiť">
                                            <span className="mf-thLabel">Začiatok</span>
                                            {sortIcon("startTime")}
                                        </th>

                                        <th className="mf-sortable" onClick={() => toggleSort("endTime")} title="Zoradiť">
                                            <span className="mf-thLabel">Koniec</span>
                                            {sortIcon("endTime")}
                                        </th>

                                        <th className="mf-num mf-sortable" onClick={() => toggleSort("distanceKm")} title="Zoradiť">
                                            <span className="mf-thLabel">Vzdialenosť</span>
                                            {sortIcon("distanceKm")}
                                        </th>

                                        <th className="mf-num mf-sortable" onClick={() => toggleSort("recordCount")} title="Zoradiť">
                                            <span className="mf-thLabel"># záznamov</span>
                                            {sortIcon("recordCount")}
                                        </th>

                                        <th className="mf-actions">Akcia</th>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {pageFlights.map((f) => (
                                        <tr key={f.id}>
                                            <td className="mf-name">{f.name}</td>
                                            <td>{formatDT(f.startTime)}</td>
                                            <td>{formatDT(f.endTime)}</td>
                                            <td className="mf-num">
                                                {typeof f.distanceKm === "number" ? `${f.distanceKm.toFixed(2)} km` : "—"}
                                            </td>
                                            <td className="mf-num">
                                                {typeof f.recordCount === "number" ? f.recordCount : "—"}
                                            </td>
                                            <td className="mf-actions">
                                                <button
                                                    onClick={() => handleDetail(f.id)}
                                                    className="mf-btn mf-btn--primary"
                                                >
                                                    Detaily
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(f.id)}
                                                    disabled={deletingId === f.id}
                                                    className="mf-btn mf-btn--danger"
                                                    aria-label="Zmazať let"
                                                    title="Zmazať"
                                                >
                                                    {deletingId === f.id ? "Mazanie…" : "🗑"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="mf-pagination">
                                <button
                                    className="mf-pageBtn"
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Späť
                                </button>

                                <div className="mf-pageInfo">
                                    Strana <strong>{currentPage}</strong> / {totalPages}
                                </div>

                                <button
                                    className="mf-pageBtn"
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Ďalej
                                </button>

                                <button
                                    className="mf-pageBtn mf-pageBtn--ghost"
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
                                    className="mf-pageInput"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
