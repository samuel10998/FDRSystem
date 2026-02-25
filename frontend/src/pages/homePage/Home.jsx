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

// ✅ new showcase images (replace these files with your real screenshots if needed)
import photo1 from "../../assets/photo1.png";
import photo2 from "../../assets/photo2.png";
import photo3 from "../../assets/photo3.png";

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
        title: "Upload aj Cloud Sync",
        desc: "Logy vieš odovzdať manuálne alebo cez cloud inbox workflow.",
    },
    {
        title: "Analýza letu",
        desc: "Spracovanie dát, metriky letu a prehľad bezpečnostných udalostí.",
    },
    {
        title: "Mapa a časové grafy",
        desc: "Interaktívna trasa + vývoj senzorov v čase na jednom mieste.",
    },
    {
        title: "Podpora zariadení",
        desc: "Pridelené adminom alebo vlastné zariadenie s integračnou šablónou.",
    },
];

const SHOWCASE_ITEMS = [
    {
        img: photo1,
        title: "Štatistika letu",
        desc: "Kľúčové KPI na jednom mieste: vzdialenosť, trvanie letu, počet záznamov a max. rýchlosť.",
    },
    {
        img: photo2,
        title: "GPS mapa trasy",
        desc: "Interaktívna mapa letu so štartom, koncom a priebehom celej trasy podľa GPS bodov.",
    },
    {
        img: photo3,
        title: "Grafy senzorov",
        desc: "Časové grafy rýchlosti, turbulencie a ďalších veličín pre rýchlu aj detailnú analýzu.",
    },
];

const WORKFLOW_STEPS = [
    "FDR zariadenie zaznamená letové údaje",
    "Upload alebo Cloud Sync odošle dáta do systému",
    "Systém údaje spracuje a validuje",
    "Vypočíta metriky a analytické prehľady",
    "Výsledky zobrazí v mapách, grafoch a štatistikách",
];

export default function Home() {
    const navigate = useNavigate();
    const [index, setIndex] = useState(0);
    const [activePreview, setActivePreview] = useState(null);
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

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                setActivePreview(null);
            }
        };

        if (activePreview) {
            document.body.classList.add("home-modalOpen");
            window.addEventListener("keydown", onKeyDown);
        }

        return () => {
            document.body.classList.remove("home-modalOpen");
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [activePreview]);

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
                        <h2>FDRSystem v skratke</h2>
                        <p>
                            FDRSystem prepája Flight Data Recorder zariadenie a webovú aplikáciu do
                            jedného pracovného toku: od záznamu letu, cez import dát, až po analýzu
                            a vizualizáciu výsledkov.
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

            {/* NEW: SHOWCASE SECTION */}
            <section className="home-showcase" aria-labelledby="home-showcase-title">
                <div className="home-showcaseCard">
                    <div className="home-showcaseHeader">
                        <div className="home-smallTitle">Ukážky z aplikácie</div>
                        <h2 id="home-showcase-title">Analýza letu na 3 obrazovkách</h2>
                        <p>
                            Rýchly prehľad toho najdôležitejšieho: štatistika letu, GPS mapa trasy
                            a grafy nameraných veličín.
                        </p>
                    </div>

                    <div className="home-showcaseGrid">
                        {SHOWCASE_ITEMS.map((item) => (
                            <article key={item.title} className="home-showcaseItem">
                                <button
                                    type="button"
                                    className="home-showcaseImageBtn"
                                    onClick={() => setActivePreview(item)}
                                    aria-label={`Zväčšiť ukážku: ${item.title}`}
                                >
                                    <div className="home-showcaseImageWrap">
                                        <img className="home-showcaseImage" src={item.img} alt={item.title} />
                                    </div>
                                </button>
                                <div className="home-showcaseBody">
                                    <h3>{item.title}</h3>
                                    <p>{item.desc}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {activePreview && (
                <div
                    className="home-modalOverlay"
                    role="dialog"
                    aria-modal="true"
                    aria-label={activePreview.title}
                    onClick={() => setActivePreview(null)}
                >
                    <div
                        className="home-modalFrame"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="home-modalClose"
                            onClick={() => setActivePreview(null)}
                            aria-label="Zavrieť náhľad"
                            title="Zavrieť"
                        >
                            ×
                        </button>

                        <div className="home-modalImageWrap">
                            <img
                                src={activePreview.img}
                                alt={activePreview.title}
                                className="home-modalImage"
                            />
                        </div>

                        <div className="home-modalMeta">
                            <h3>{activePreview.title}</h3>
                            <p>{activePreview.desc}</p>
                        </div>
                    </div>
                </div>
            )}

            <section className="home-overview" aria-labelledby="home-workflow-title">
                <div className="home-overviewCard">
                    <h2 id="home-workflow-title">Ako systém funguje</h2>
                    <ul className="home-workflowList" aria-label="Workflow systému">
                        {WORKFLOW_STEPS.map((step) => (
                            <li key={step}>{step}</li>
                        ))}
                    </ul>

                    <div className="home-cloudBox">
                        <h3>Cloud Sync</h3>
                        <p>
                            Systém podporuje cloud inbox model (Cloudflare-based workflow) pre
                            používateľov s prideleným aj vlastným zariadením.
                        </p>
                        <p>
                            Detailný postup pre scenár admin-prideleného zariadenia a pre vlastnú
                            integráciu nájdeš na stránke Info.
                        </p>
                    </div>

                    <div className="home-actions">
                        <button className="home-btn home-btn--ghost" onClick={() => navigate("/info")}>
                            Zobraziť detail workflow
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}
