import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

// ✅ images from src/assets
import airplane1 from "../../assets/airplane1.jpg";
import airplane2 from "../../assets/airplane2.jpg";
import airplane3 from "../../assets/airplane3.jpg";
import helicopter1 from "../../assets/helicopter1.jpg";
import cockpitHeli from "../../assets/cockpit_helicopter.jpg";
import logo from "../../assets/Logo.png";

const SLIDE_MS = 6500; // ~5–8s (zmeň podľa potreby)

const SLIDES = [
    {
        img: airplane1,
        kicker: "Flight Data Recorder",
        title: "Analýza letových dát v prehľadnom reporte",
        desc: "Nahraj súbor a okamžite uvidíš štatistiky, mapu trasy a grafy z letu.",
    },
    {
        img: airplane2,
        kicker: "Route & Timeline",
        title: "Mapa trasy + časové grafy",
        desc: "Vizualizuj GPS trasu a sleduj výšku, tlak, teplotu či rýchlosť v čase.",
    },
    {
        img: airplane3,
        kicker: "Safety Insights",
        title: "Bezpečnostné udalosti a limity",
        desc: "Detekcia udalostí ako vysoká turbulencia alebo teplota podľa thresholdov.",
    },
    {
        img: helicopter1,
        kicker: "For Pilots & Engineers",
        title: "Rýchly prehľad aj detailné dáta",
        desc: "Od KPI metrík až po jednotlivé záznamy – všetko na jednom mieste.",
    },
    {
        img: cockpitHeli,
        kicker: "Built for Your FDR",
        title: "Navrhnuté pre tvoje ESP32 FDR zariadenie",
        desc: "Systém je prispôsobený formátu dát z tvojho rekordéra (GPS + senzory).",
    },
];

const FEATURES = [
    {
        title: "Interaktívna mapa trasy",
        desc: "GPS trasa letu prehľadne v mape.",
    },
    {
        title: "Grafy senzorov",
        desc: "Teplota, tlak, výška, turbulencia, rýchlosť.",
    },
    {
        title: "Štatistiky letu",
        desc: "Min/Max/Avg + základné KPI metriky.",
    },
    {
        title: "Bezpečnostné prehľady",
        desc: "Detekcia turbulence a extrémnych hodnôt podľa limitov",
    },
];

export default function Home() {
    const navigate = useNavigate();
    const [index, setIndex] = useState(0);
    const timerRef = useRef(null);

    const count = SLIDES.length;
    const active = SLIDES[index];

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setIndex((i) => (i + 1) % count);
        }, SLIDE_MS);
    };

    useEffect(() => {
        startTimer();
        return () => timerRef.current && clearInterval(timerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const goPrev = () => {
        setIndex((i) => (i - 1 + count) % count);
        startTimer();
    };

    const goNext = () => {
        setIndex((i) => (i + 1) % count);
        startTimer();
    };

    const goTo = (i) => {
        setIndex(i);
        startTimer();
    };

    return (
        <main className="home">
            {/* HERO */}
            <section className="home-hero">
                {/* Slides (stacked, crossfade) */}
                <div className="home-heroSlides" aria-hidden="true">
                    {SLIDES.map((s, i) => (
                        <div
                            key={`${s.kicker}-${i}`}
                            className={`home-heroSlide ${i === index ? "is-active" : ""}`}
                            style={{ backgroundImage: `url(${s.img})` }}
                        />
                    ))}
                </div>

                {/* overlay for readability */}
                <div className="home-heroOverlay" aria-hidden="true" />

                {/* text */}
                <div className="home-heroInner">
                    <div className="home-heroText">
                        <div className="home-kicker">{active.kicker}</div>
                        <h1 className="home-title">{active.title}</h1>
                        <p className="home-desc">{active.desc}</p>

                        <div className="home-cta">
                            {/* Host môže len login */}
                            <button
                                className="home-btn home-btn--primary"
                                onClick={() => navigate("/login")}
                            >
                                Prihlásiť sa
                            </button>
                        </div>
                    </div>
                </div>

                {/* arrows */}
                <button
                    type="button"
                    className="home-nav home-nav--left"
                    onClick={goPrev}
                    aria-label="Predchádzajúci obrázok"
                    title="Predchádzajúci"
                >
                    ‹
                </button>
                <button
                    type="button"
                    className="home-nav home-nav--right"
                    onClick={goNext}
                    aria-label="Ďalší obrázok"
                    title="Ďalší"
                >
                    ›
                </button>

                {/* dots */}
                <div className="home-dots" role="tablist" aria-label="Výber obrázka">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            className={`home-dot ${i === index ? "is-active" : ""}`}
                            onClick={() => goTo(i)}
                            aria-label={`Obrázok ${i + 1}`}
                            aria-pressed={i === index}
                        />
                    ))}
                </div>
            </section>

            {/* INTRO */}
            <section className="home-intro">
                <div className="home-introCard">
                    <div className="home-logoWrap">
                        <img className="home-logo" src={logo} alt="FDR Systems Logo" />
                    </div>

                    <div className="home-introText">
                        <h2>Flight Data Recorder System</h2>
                        <p>
                            Webová aplikácia na nahrávanie a analýzu letových záznamov z Flight
                            Data Recorder zariadenia. Získaj rýchly prehľad aj detailné dáta v
                            jednom rozhraní.
                        </p>

                        <div className="home-features">
                            {FEATURES.map((f) => (
                                <div key={f.title} className="home-feature">
                                    <div className="home-featureTitle">{f.title}</div>
                                    <div className="home-featureDesc">{f.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
