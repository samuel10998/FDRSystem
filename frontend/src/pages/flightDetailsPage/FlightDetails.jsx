import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import "leaflet/dist/leaflet.css";
import "./FlightDetails.css";

// Pomocná funkcia na parsovanie času (HH:mm:ss) ako Date objekt
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
                console.error("Chyba pri načítaní detailov:", err);
                alert("Nepodarilo sa načítať detaily letu.");
            } finally {
                if (alive) setLoading(false);
            }
        }

        fetchData();
        return () => { alive = false; };
    }, [id]);

    if (loading) return <p className="loading">Načítavam…</p>;
    if (!flight) return <p className="error">Let sa nenašiel.</p>;

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
                        <tr>
                            <th></th>
                            <th>Min</th>
                            <th>Max</th>
                            <th>Priemer</th>
                        </tr>
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

            {records.length > 0 && (
                <div className="card">
                    <h3>Trasa letu</h3>
                    <MapContainer
                        center={[records[0].latitude, records[0].longitude]}
                        zoom={15}
                        style={{ height: "400px", width: "100%" }}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Polyline positions={records.map(r => [r.latitude, r.longitude])} />
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
                            tickFormatter={(v) => {
                                const date = parseTimeOnly(v);
                                return date.toLocaleTimeString();
                            }}
                        />
                        <YAxis />
                        <Tooltip
                            labelFormatter={(v) => {
                                const date = parseTimeOnly(v);
                                return date.toLocaleTimeString();
                            }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="temperatureC" stroke="#ff7300" name="Teplota (°C)" />
                        <Line type="monotone" dataKey="pressureHpa" stroke="#387908" name="Tlak (hPa)" />
                        <Line type="monotone" dataKey="altitudeM" stroke="#0033cc" name="Výška (m)" />
                    </LineChart>
                </div>
            )}
        </section>
    );
}
