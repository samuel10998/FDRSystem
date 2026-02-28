import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import "./FlightDetails.css";

/** QUICK TUNING of THRESHOLD values */
const THRESHOLDS = {
    temperatureC: 40,
    turbulenceG: 0.7,
    speedKn: 149,
    altitudeM: 3000
};

/** Event rules (you can tweak these easily later) */
const EVENT_RULES = {
    minDurationSec: 3, // ignore spikes shorter than this
    mergeGapSec: 2     // merge two events if gap between them is <= this
};

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow
});

const startIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    iconRetinaUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const endIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    iconRetinaUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const parseTimeOnly = (timeStr) => {
    if (!timeStr) return new Date("1970-01-01T00:00:00");
    return new Date(`1970-01-01T${timeStr}`);
};

const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const fmt = (v, digits = 1) => (isNum(v) ? v.toFixed(digits) : "—");

function safeMax(records, key) {
    let m = -Infinity;
    for (const r of records) {
        const v = r?.[key];
        if (isNum(v)) m = Math.max(m, v);
    }
    return m === -Infinity ? null : m;
}

function formatShortDuration(sec) {
    if (!isNum(sec)) return "—";
    if (sec < 60) return `${sec.toFixed(1)}s`;
    const m = Math.floor(sec / 60);
    const s = sec - m * 60;
    if (m < 60) return `${m}m ${Math.round(s)}s`;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}h ${mm}m`;
}

function estimateSamplePeriodSec(flight, records) {
    const n = records?.length ?? 0;
    if (n < 2) return 0.2; // fallback
    const startMs = flight?.startTime ? new Date(flight.startTime).getTime() : null;
    const endMs = flight?.endTime ? new Date(flight.endTime).getTime() : null;

    if (startMs && endMs && endMs > startMs) {
        return (endMs - startMs) / 1000 / (n - 1);
    }
    return 0.2;
}

/**
 * Build smarter "safety events" as segments:
 * - segment = consecutive samples >= threshold
 * - filter by minDurationSec
 * - merge segments separated by <= mergeGapSec
 */
function buildSegmentEvents(records, key, threshold, opts) {
    const {
        title,
        units,
        digits = 1,
        samplePeriodSec = 0.2,
        minDurationSec = 3,
        mergeGapSec = 2
    } = opts;

    const n = records.length;
    if (n === 0) return [];

    // 1) raw segments [startIdx, endIdx]
    const segments = [];
    let startIdx = null;

    for (let i = 0; i < n; i++) {
        const v = records[i]?.[key];
        const above = isNum(v) && v >= threshold;

        if (above && startIdx === null) startIdx = i;
        if (!above && startIdx !== null) {
            segments.push([startIdx, i - 1]);
            startIdx = null;
        }
    }
    if (startIdx !== null) segments.push([startIdx, n - 1]);

    if (segments.length === 0) return [];

    // 2) merge close segments
    const allowedGapSamples = Math.max(0, Math.round(mergeGapSec / samplePeriodSec));
    const merged = [];
    for (const seg of segments) {
        if (merged.length === 0) {
            merged.push([...seg]);
            continue;
        }
        const prev = merged[merged.length - 1];
        const gap = seg[0] - prev[1] - 1;
        if (gap <= allowedGapSamples) {
            prev[1] = seg[1]; // merge
        } else {
            merged.push([...seg]);
        }
    }

    // 3) build final events + filter short ones
    const events = [];
    merged.forEach(([s, e], idx) => {
        const durationSec = (e - s + 1) * samplePeriodSec;
        if (durationSec < minDurationSec) return;

        let peak = -Infinity;
        let sum = 0;
        let count = 0;

        for (let i = s; i <= e; i++) {
            const v = records[i]?.[key];
            if (!isNum(v)) continue;
            peak = Math.max(peak, v);
            sum += v;
            count++;
        }

        const avg = count > 0 ? sum / count : null;

        const startTime = records[s]?.time ?? "—";
        const endTime = records[e]?.time ?? "—";

        events.push({
            id: `${key}-${idx}`,
            startIdx: s,
            title,
            time: `${startTime} → ${endTime}, ${formatShortDuration(durationSec)}`,
            detail: `Peak: ${fmt(peak, digits)} ${units} · Avg: ${fmt(avg, digits)} ${units} (threshold ${threshold} ${units})`
        });
    });

    return events;
}

export default function FlightDetails() {
    const { id } = useParams();
    const [flight, setFlight] = useState(null);
    const [stats, setStats] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    // map click popup
    const [clickPos, setClickPos] = useState(null);
    const [clickRecord, setClickRecord] = useState(null);

    // safety expand
    const [eventsOpen, setEventsOpen] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);
    const reportExportRef = useRef(null);

    useEffect(() => {
        let alive = true;

        async function fetchData() {
            try {
                const [flightRes, statsRes, recordsRes] = await Promise.all([
                    api.get(`/api/flights/${id}`),
                    api.get(`/api/flights/${id}/stats`),
                    api.get(`/api/flights/${id}/records`)
                ]);

                if (!alive) return;
                setFlight(flightRes.data);
                setStats(statsRes.data);
                setRecords(recordsRes.data);
            } catch (err) {
                console.error("Error loading flight details:", err);
                alert("Nepodarilo sa načítať detaily letu.");
            } finally {
                alive && setLoading(false);
            }
        }

        fetchData();
        return () => {
            alive = false;
        };
    }, [id]);

    const geoRecords = useMemo(
        () => records.filter(r => isNum(r.latitude) && isNum(r.longitude)),
        [records]
    );

    const pathPositions = useMemo(
        () => geoRecords.map(r => [r.latitude, r.longitude]),
        [geoRecords]
    );

    const startPos = pathPositions[0];
    const endPos = pathPositions[pathPositions.length - 1];

    // derived "Max observed" (from records – not only stats)
    const maxObserved = useMemo(() => {
        return {
            maxAltitudeM: safeMax(records, "altitudeM"),
            maxSpeedKn: safeMax(records, "speedKn"),
            maxTempC: safeMax(records, "temperatureC"),
            maxTurbG: safeMax(records, "turbulenceG")
        };
    }, [records]);

    const samplePeriodSec = useMemo(
        () => estimateSamplePeriodSec(flight, records),
        [flight, records]
    );

    // Safety events list (SMART segments + count)
    const safetyEvents = useMemo(() => {
        const events = [];

        events.push(
            ...buildSegmentEvents(records, "temperatureC", THRESHOLDS.temperatureC, {
                title: "High temperature",
                units: "°C",
                digits: 1,
                samplePeriodSec,
                minDurationSec: EVENT_RULES.minDurationSec,
                mergeGapSec: EVENT_RULES.mergeGapSec
            })
        );

        events.push(
            ...buildSegmentEvents(records, "turbulenceG", THRESHOLDS.turbulenceG, {
                title: "High turbulence",
                units: "G",
                digits: 3,
                samplePeriodSec,
                minDurationSec: EVENT_RULES.minDurationSec,
                mergeGapSec: EVENT_RULES.mergeGapSec
            })
        );

        events.push(
            ...buildSegmentEvents(records, "speedKn", THRESHOLDS.speedKn, {
                title: "High speed",
                units: "kn",
                digits: 1,
                samplePeriodSec,
                minDurationSec: EVENT_RULES.minDurationSec,
                mergeGapSec: EVENT_RULES.mergeGapSec
            })
        );

        events.push(
            ...buildSegmentEvents(records, "altitudeM", THRESHOLDS.altitudeM, {
                title: "High altitude",
                units: "m",
                digits: 0,
                samplePeriodSec,
                minDurationSec: EVENT_RULES.minDurationSec,
                mergeGapSec: EVENT_RULES.mergeGapSec
            })
        );

        // Sort by when it happened in flight
        events.sort((a, b) => (a.startIdx ?? 0) - (b.startIdx ?? 0));
        return events;
    }, [records, samplePeriodSec]);

    async function handleExportPdf() {
        if (!reportExportRef.current || exportingPdf) return;

        try {
            setExportingPdf(true);
            const target = reportExportRef.current;

            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            await new Promise((resolve) => setTimeout(resolve, 350));

            const canvas = await html2canvas(target, {
                scale: 2,
                backgroundColor: "#ffffff",
                useCORS: true,
                logging: false,
                ignoreElements: (el) => el.classList?.contains("no-pdf"),
                windowWidth: document.documentElement.scrollWidth,
                windowHeight: document.documentElement.scrollHeight
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            const safeName = String(flight?.name || "flight")
                .toLowerCase()
                .replace(/[^a-z0-9_-]+/gi, "-")
                .replace(/^-+|-+$/g, "");

            pdf.save(`flight-report-${safeName || "flight"}.pdf`);
        } catch (err) {
            console.error("Export PDF error:", err);
            alert("Nepodarilo sa exportovať PDF report.");
        } finally {
            setExportingPdf(false);
        }
    }

    function onRouteClick(e) {
        const clicked = [e.latlng.lat, e.latlng.lng];
        let best = null;
        let bestD = Infinity;

        // squared distance on lat/lon (good enough for nearest point)
        for (const r of geoRecords) {
            const d = Math.pow(clicked[0] - r.latitude, 2) + Math.pow(clicked[1] - r.longitude, 2);
            if (d < bestD) {
                bestD = d;
                best = r;
            }
        }

        setClickPos(clicked);
        setClickRecord(best);
    }

    if (loading) return <p className="loading">Načítavam…</p>;
    if (!flight) return <p className="error">Let sa nenašiel.</p>;

    const durationText = stats?.duration ?? "—";
    const distanceText = isNum(flight.distanceKm) ? `${flight.distanceKm.toFixed(2)} km` : "—";
    const recordsText = isNum(flight.recordCount) ? `${flight.recordCount}` : "—";

    const safetyCount = safetyEvents.length;
    const safetyBadgeClass = safetyCount === 0 ? "badge badge--ok" : "badge badge--warn";

    return (
        <section className="flight-details">
            {/* ONE BIG REPORT CONTAINER */}
            <div className="report">
                <div className="report-actions no-pdf">
                    <button
                        className="export-pdf-button"
                        onClick={handleExportPdf}
                        disabled={exportingPdf}
                    >
                        {exportingPdf ? "Exportujem…" : "Export PDF"}
                    </button>
                </div>

                <div ref={reportExportRef} className="export-capture">
                    <div className="report-header">
                        <div>
                            <div className="report-title">Flight Report</div>
                            <div className="report-subtitle">{flight.name}</div>

                            <div className="meta-grid">
                                <div className="meta-item">
                                    <span className="meta-label">Start</span>
                                    <span className="meta-value">{new Date(flight.startTime).toLocaleString()}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">End</span>
                                    <span className="meta-value">{new Date(flight.endTime).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="kpi-row">
                            <div className="kpi">
                                <div className="kpi-label">Distance</div>
                                <div className="kpi-value">{distanceText}</div>
                            </div>
                            <div className="kpi">
                                <div className="kpi-label">Duration</div>
                                <div className="kpi-value">{durationText}</div>
                            </div>
                            <div className="kpi">
                                <div className="kpi-label">Records</div>
                                <div className="kpi-value">{recordsText}</div>
                            </div>
                            <div className="kpi">
                                <div className="kpi-label">Max Speed</div>
                                <div className="kpi-value">
                                    {maxObserved.maxSpeedKn == null ? "—" : `${fmt(maxObserved.maxSpeedKn, 1)} kn`}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* REPORT SECTIONS */}
                    <div className="report-grid">
                        {/* Safety events detected */}
                        <div className="section section--full">
                            <div className="section-header">
                                <div>Safety events detected</div>

                                <button
                                    className="safety-button"
                                    onClick={() => safetyCount > 0 && setEventsOpen(v => !v)}
                                    title={safetyCount === 0 ? "No events" : "Click to view details"}
                                >
                <span className={safetyBadgeClass}>
                  {safetyCount === 0 ? "NONE" : safetyCount}
                </span>
                                </button>
                            </div>

                            {safetyCount > 0 && eventsOpen && (
                                <div className="section-body">
                                    <ul className="events-list">
                                        {safetyEvents.map(ev => (
                                            <li key={ev.id} className="event-item">
                                                <div className="event-title">
                                                    {ev.title} <span className="event-time">({ev.time})</span>
                                                </div>
                                                <div className="event-detail">{ev.detail}</div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Max Observed */}
                        <div className="section">
                            <div className="section-header">Max Observed</div>
                            <div className="section-body">
                                <div className="kv-row">
                                    <div className="kv-key">Max Altitude</div>
                                    <div className="kv-val">{maxObserved.maxAltitudeM == null ? "—" : `${fmt(maxObserved.maxAltitudeM, 0)} m`}</div>
                                </div>
                                <div className="kv-row">
                                    <div className="kv-key">Max Speed</div>
                                    <div className="kv-val">{maxObserved.maxSpeedKn == null ? "—" : `${fmt(maxObserved.maxSpeedKn, 1)} kn`}</div>
                                </div>
                                <div className="kv-row">
                                    <div className="kv-key">Max Temperature</div>
                                    <div className="kv-val">{maxObserved.maxTempC == null ? "—" : `${fmt(maxObserved.maxTempC, 1)} °C`}</div>
                                </div>
                                <div className="kv-row">
                                    <div className="kv-key">Max Turbulence</div>
                                    <div className="kv-val">{maxObserved.maxTurbG == null ? "—" : `${fmt(maxObserved.maxTurbG, 3)} G`}</div>
                                </div>
                            </div>
                        </div>

                        {/* Statistics */}
                        {stats && (
                            <div className="section section--wide">
                                <div className="section-header">Statistics (Min / Max / Avg)</div>
                                <div className="section-body">
                                    <table className="stats-table">
                                        <thead>
                                        <tr>
                                            <th></th>
                                            <th>Min</th>
                                            <th>Max</th>
                                            <th>Avg</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr>
                                            <td>Temperature (°C)</td>
                                            <td>{fmt(stats.minTemperatureC, 1)}</td>
                                            <td>{fmt(stats.maxTemperatureC, 1)}</td>
                                            <td>{fmt(stats.avgTemperatureC, 1)}</td>
                                        </tr>
                                        <tr>
                                            <td>Pressure (hPa)</td>
                                            <td>{fmt(stats.minPressureHpa, 1)}</td>
                                            <td>{fmt(stats.maxPressureHpa, 1)}</td>
                                            <td>{fmt(stats.avgPressureHpa, 1)}</td>
                                        </tr>
                                        <tr>
                                            <td>Altitude (m)</td>
                                            <td>{fmt(stats.minAltitudeM, 1)}</td>
                                            <td>{fmt(stats.maxAltitudeM, 1)}</td>
                                            <td>{fmt(stats.avgAltitudeM, 1)}</td>
                                        </tr>
                                        <tr>
                                            <td>Turbulence (G)</td>
                                            <td>{fmt(stats.minTurbulenceG, 3)}</td>
                                            <td>{fmt(stats.maxTurbulenceG, 3)}</td>
                                            <td>{fmt(stats.avgTurbulenceG, 3)}</td>
                                        </tr>
                                        <tr>
                                            <td>Speed (kn)</td>
                                            <td>{fmt(stats.minSpeedKn, 1)}</td>
                                            <td>{fmt(stats.maxSpeedKn, 1)}</td>
                                            <td>{fmt(stats.avgSpeedKn, 1)}</td>
                                        </tr>
                                        </tbody>
                                        <tfoot>
                                        <tr>
                                            <td>Duration</td>
                                            <td colSpan="3">{durationText}</td>
                                        </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* MAP */}
                    {pathPositions.length > 0 && (
                        <div className="report-block no-pdf">
                            <div className="block-title">Route Map</div>
                            <MapContainer className="flight-map" center={startPos} zoom={15}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Polyline positions={pathPositions} eventHandlers={{ click: onRouteClick }} />
                                <Marker position={startPos} icon={startIcon}>
                                    <Popup>Štart letu</Popup>
                                </Marker>
                                <Marker position={endPos} icon={endIcon}>
                                    <Popup>Koniec letu</Popup>
                                </Marker>

                                {clickPos && clickRecord && (
                                    <Popup position={clickPos} onClose={() => setClickPos(null)}>
                                        <div className="route-popup">
                                            <p><strong>Čas:</strong> {clickRecord.time}</p>
                                            <p><strong>Teplota:</strong> {fmt(clickRecord.temperatureC, 1)} °C</p>
                                            <p><strong>Tlak:</strong> {fmt(clickRecord.pressureHpa, 1)} hPa</p>
                                            <p><strong>Výška:</strong> {fmt(clickRecord.altitudeM, 0)} m</p>
                                            <p><strong>Turbulencia:</strong> {fmt(clickRecord.turbulenceG, 3)} G</p>
                                            <p><strong>Rýchlosť:</strong> {fmt(clickRecord.speedKn, 1)} kn</p>
                                        </div>
                                    </Popup>
                                )}
                            </MapContainer>
                        </div>
                    )}

                    {/* CHARTS */}
                    {records.length > 0 && (
                        <div className="charts-grid">
                            <div className="chart-card">
                                <div className="block-title">Trends (Pressure / Altitude)</div>
                                <div className="chart-wrap">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={records}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="time"
                                                tickFormatter={(v) => parseTimeOnly(v).toLocaleTimeString()}
                                            />
                                            <YAxis />
                                            <Tooltip labelFormatter={(v) => parseTimeOnly(v).toLocaleTimeString()} />
                                            <Legend />
                                            <Line type="monotone" dataKey="pressureHpa" name="Tlak (hPa)" stroke="#10b981" dot={false} isAnimationActive={false} />
                                            <Line type="monotone" dataKey="altitudeM" name="Výška (m)" stroke="#3b82f6" dot={false} isAnimationActive={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="chart-card">
                                <div className="block-title">Temperature</div>
                                <div className="chart-wrap">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={records}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="time"
                                                tickFormatter={(v) => parseTimeOnly(v).toLocaleTimeString()}
                                            />
                                            <YAxis />
                                            <Tooltip labelFormatter={(v) => parseTimeOnly(v).toLocaleTimeString()} />
                                            <Legend />
                                            <Line type="monotone" dataKey="temperatureC" name="Teplota (°C)" stroke="#f59e0b" dot={false} isAnimationActive={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="chart-card chart-card--full">
                                <div className="block-title">Speed</div>
                                <div className="chart-wrap">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={records}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="time"
                                                tickFormatter={(v) => parseTimeOnly(v).toLocaleTimeString()}
                                            />
                                            <YAxis />
                                            <Tooltip labelFormatter={(v) => parseTimeOnly(v).toLocaleTimeString()} />
                                            <Legend />
                                            <Line type="monotone" dataKey="speedKn" name="Rýchlosť (kn)" stroke="#ec4899" dot={false} isAnimationActive={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="chart-card chart-card--full">
                                <div className="block-title">Turbulence</div>
                                <div className="chart-wrap">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={records}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="time"
                                                tickFormatter={(v) => parseTimeOnly(v).toLocaleTimeString()}
                                            />
                                            <YAxis />
                                            <Tooltip labelFormatter={(v) => parseTimeOnly(v).toLocaleTimeString()} />
                                            <Legend />
                                            <Line type="monotone" dataKey="turbulenceG" name="Turbulencia (G)" stroke="#8b5cf6" dot={false} isAnimationActive={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}