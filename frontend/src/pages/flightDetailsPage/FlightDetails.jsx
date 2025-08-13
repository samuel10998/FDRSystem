// src/pages/flightDetailsPage/FlightDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

import {
    MapContainer,
    TileLayer,
    Polyline,
    Marker,
    Popup
} from "react-leaflet";
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
    Legend
} from "recharts";

import "./FlightDetails.css";

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

export default function FlightDetails() {
    const { id } = useParams();
    const [flight, setFlight] = useState(null);
    const [stats, setStats] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clickPos, setClickPos] = useState(null);
    const [clickRecord, setClickRecord] = useState(null);

    useEffect(() => {
        let alive = true;

        async function fetchData() {
            try {
                const [flightRes, statsRes, recordsRes] = await Promise.all([
                    api.get(`/api/flights/${id}`),
                    api.get(`/api/flights/${id}/stats`),
                    api.get(`/api/flights/${id}/records`)
                ]);

                if (alive) {
                    setFlight(flightRes.data);
                    setStats(statsRes.data);
                    setRecords(recordsRes.data);
                }
            } catch (err) {
                console.error("Error loading flight details:", err);
                alert("Nepodarilo sa načítať detaily letu.");
            } finally {
                alive && setLoading(false);
            }
        }

        fetchData();
        return () => { alive = false; };
    }, [id]);

    if (loading) return <p className="loading">Načítavam…</p>;
    if (!flight) return <p className="error">Let sa nenašiel.</p>;

    const pathPositions = records.map(r => [r.latitude, r.longitude]);
    const startPos = pathPositions[0];
    const endPos = pathPositions[pathPositions.length - 1];

    const sqDist = (a, b) =>
        Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2);

    function onRouteClick(e) {
        const clicked = [e.latlng.lat, e.latlng.lng];
        let best = null, bestD = Infinity;
        records.forEach(r => {
            const d = sqDist(clicked, [r.latitude, r.longitude]);
            if (d < bestD) {
                bestD = d;
                best = r;
            }
        });
        setClickPos(clicked);
        setClickRecord(best);
    }

    return (
        <section className="flight-details">
            <h2>Detail letu</h2>

            <div className="card">
                <h3>{flight.name}</h3>
                <p><strong>Začiatok:</strong> {new Date(flight.startTime).toLocaleString()}</p>
                <p><strong>Koniec:</strong> {new Date(flight.endTime).toLocaleString()}</p>
                <p><strong>Počet záznamov:</strong> {flight.recordCount}</p>
            </div>

            {stats && (
                <div className="card">
                    <h3>Štatistiky</h3>
                    <table className="stats-table">
                        <thead>
                        <tr><th></th><th>Min</th><th>Max</th><th>Priemer</th></tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>Teplota (°C)</td>
                            <td>{stats.minTemperatureC.toFixed(1)}</td>
                            <td>{stats.maxTemperatureC.toFixed(1)}</td>
                            <td>{stats.avgTemperatureC.toFixed(1)}</td>
                        </tr>
                        <tr>
                            <td>Tlak (hPa)</td>
                            <td>{stats.minPressureHpa.toFixed(1)}</td>
                            <td>{stats.maxPressureHpa.toFixed(1)}</td>
                            <td>{stats.avgPressureHpa.toFixed(1)}</td>
                        </tr>
                        <tr>
                            <td>Výška (m)</td>
                            <td>{stats.minAltitudeM.toFixed(1)}</td>
                            <td>{stats.maxAltitudeM.toFixed(1)}</td>
                            <td>{stats.avgAltitudeM.toFixed(1)}</td>
                        </tr>
                        <tr>
                            <td>Turbulencia (G)</td>
                            <td>{stats.minTurbulenceG.toFixed(3)}</td>
                            <td>{stats.maxTurbulenceG.toFixed(3)}</td>
                            <td>{stats.avgTurbulenceG.toFixed(3)}</td>
                        </tr>
                        </tbody>
                        <tfoot>
                        <tr>
                            <td>Trvanie</td>
                            <td colSpan="3">{stats.duration}</td>
                        </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {pathPositions.length > 0 && (
                <div className="card">
                    <h3>Trasa letu</h3>
                    <MapContainer
                        center={startPos}
                        zoom={15}
                        style={{ height: "400px", width: "100%" }}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Polyline
                            positions={pathPositions}
                            color="blue"
                            eventHandlers={{ click: onRouteClick }}
                        />
                        <Marker position={startPos} icon={startIcon}>
                            <Popup>Štart letu</Popup>
                        </Marker>
                        <Marker position={endPos} icon={endIcon}>
                            <Popup>Koniec letu</Popup>
                        </Marker>

                        {clickPos && clickRecord && (
                            <Popup
                                position={clickPos}
                                onClose={() => setClickPos(null)}
                            >
                                <div className="route-popup">
                                    <p><strong>Čas:</strong> {clickRecord.time}</p>
                                    <p><strong>Teplota:</strong> {clickRecord.temperatureC} °C</p>
                                    <p><strong>Tlak:</strong> {clickRecord.pressureHpa} hPa</p>
                                    <p><strong>Výška:</strong> {clickRecord.altitudeM} m</p>
                                    <p><strong>Turbulencia:</strong> {clickRecord.turbulenceG} G</p>
                                </div>
                            </Popup>
                        )}
                    </MapContainer>
                </div>
            )}

            {records.length > 0 && (
                <div className="card">
                    <h3>Vývoj hodnôt počas letu</h3>
                    <LineChart width={800} height={300} data={records}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="time"
                            type="category"
                            tickFormatter={v => parseTimeOnly(v).toLocaleTimeString()}
                        />
                        <YAxis />
                        <Tooltip
                            labelFormatter={v => parseTimeOnly(v).toLocaleTimeString()}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="temperatureC"
                            stroke="#ff7300"
                            name="Teplota (°C)"
                        />
                        <Line
                            type="monotone"
                            dataKey="pressureHpa"
                            stroke="#387908"
                            name="Tlak (hPa)"
                        />
                        <Line
                            type="monotone"
                            dataKey="altitudeM"
                            stroke="#0033cc"
                            name="Výška (m)"
                        />
                    </LineChart>
                </div>
            )}

            {records.length > 0 && (
                <div className="card">
                    <h3>Turbulencia počas letu</h3>
                    <LineChart width={800} height={300} data={records}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="time"
                            type="category"
                            tickFormatter={v => parseTimeOnly(v).toLocaleTimeString()}
                        />
                        <YAxis />
                        <Tooltip
                            labelFormatter={v => parseTimeOnly(v).toLocaleTimeString()}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="turbulenceG"
                            stroke="#6c43f3"
                            name="Turbulencia (G)"
                            dot={false}
                        />
                    </LineChart>
                </div>
            )}
        </section>
    );
}
