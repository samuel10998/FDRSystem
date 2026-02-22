import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./info.css";

// ✅ images from src/assets (uprav si podľa seba – nech sú len 3)
import airplane4 from "../../assets/airplane4.jpg";
import Helicopter2 from "../../assets/Helicopter2.jpg";
import cockpitHeli from "../../assets/cockpit_helicopter.jpg";

const SLIDE_MS = 5000;

const SLIDES = [
    {
        img: airplane4,
        title: "FDR Systems",
        desc: "Webová aplikácia na analýzu letových dát z tvojho Flight Data Recorder zariadenia.",
    },
    {
        img: Helicopter2,
        title: "FDR Systems",
        desc: "Vizualizácia trasy letu a senzorov v čase – rýchlo, prehľadne a bezpečne.",
    },
    {
        img: cockpitHeli,
        title: "FDR Systems",
        desc: "Od základného reportu až po detailné grafy – všetko v jednom rozhraní.",
    },
];

const FLOW = [
    "FDR zariadenie zaznamená letový log.",
    "Dáta sa prenesú cez Upload alebo Cloud Sync.",
    "Systém vykoná spracovanie a validáciu dát.",
    "Vygeneruje analytické metriky a prehľady udalostí.",
    "Výsledky zobrazí ako mapu trasy, grafy a štatistiky.",
];

export default function Info() {
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
    }, [count]);

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
        <main className="info">
            {/* HERO / SLIDER */}
            <section className="info-hero">
                <div className="info-heroSlides" aria-hidden="true">
                    {SLIDES.map((s, i) => (
                        <div
                            key={`${i}-${s.img}`}
                            className={`info-heroSlide ${i === index ? "is-active" : ""}`}
                            style={{ backgroundImage: `url(${s.img})` }}
                        />
                    ))}
                </div>

                <div className="info-heroOverlay" aria-hidden="true" />

                <div className="info-heroInner">
                    <div className="info-heroText">
                        <div className="info-kicker">INFO</div>
                        <h1 className="info-title">{active.title}</h1>
                        <p className="info-desc">{active.desc}</p>
                    </div>
                </div>

                {/* arrows */}
                <button
                    type="button"
                    className="info-nav info-nav--left"
                    onClick={goPrev}
                    aria-label="Predchádzajúci obrázok"
                    title="Predchádzajúci"
                >
                    ‹
                </button>
                <button
                    type="button"
                    className="info-nav info-nav--right"
                    onClick={goNext}
                    aria-label="Ďalší obrázok"
                    title="Ďalší"
                >
                    ›
                </button>

                {/* dots */}
                <div className="info-dots" role="tablist" aria-label="Výber obrázka">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            className={`info-dot ${i === index ? "is-active" : ""}`}
                            onClick={() => goTo(i)}
                            aria-label={`Obrázok ${i + 1}`}
                            aria-pressed={i === index}
                        />
                    ))}
                </div>
            </section>

            {/* CONTENT */}
            <section className="info-body">
                <div className="info-card">
                    <div className="info-header">
                        <div className="info-smallTitle">O projekte</div>
                        <h2 className="info-h2">Ako funguje FDRSystem</h2>
                        <p className="info-lead">
                            FDRSystem prepája hardvérové FDR zariadenie a webovú analytickú vrstvu.
                            Cieľom je spoľahlivý prenos dát z letu, ich spracovanie a zrozumiteľná
                            vizualizácia výsledkov.
                        </p>
                    </div>

                    <div className="info-grid">
                        <div className="info-section">
                            <h3 className="info-h3">Workflow systému</h3>
                            <ol className="info-list info-list--ordered">
                                {FLOW.map((step) => (
                                    <li key={step}>{step}</li>
                                ))}
                            </ol>

                            <h3 className="info-h3">Cloud Sync a cloud inbox model</h3>
                            <p className="info-p">
                                Cloud Sync je určený pre používateľov, ktorí majú so systémom
                                spárované zariadenie. Systém synchronizuje dáta pre konkrétne
                                zariadenie, importuje ich do aplikácie a spracované záznamy označí ako
                                vybavené.
                            </p>

                            <h3 className="info-h3">Dva scenáre používania</h3>
                            <div className="info-scenario">
                                <h4>Scenár A — používateľ nemá vlastné zariadenie</h4>
                                <p>
                                    Pri registrácii zvolí možnosť, že potrebuje zariadenie od admina.
                                    Admin mu následne pridelí FDR zariadenie a používateľ získa
                                    <strong>DEVICE_ID</strong> a <strong>DEVICE_KEY</strong>.
                                    Device key sa v používateľskom rozhraní zobrazí iba raz, preto si
                                    ho treba bezpečne uložiť.
                                </p>
                            </div>
                            <div className="info-scenario">
                                <h4>Scenár B — používateľ má vlastné zariadenie</h4>
                                <p>
                                    Pri registrácii zvolí, že má vlastné zariadenie. V tomto scenári
                                    admin neprideľuje nové systémové zariadenie ani nové prístupové
                                    údaje. Používateľ pracuje so svojím hardvérom podľa dostupnej
                                    integrácie a upload/sync možností v aplikácii.
                                </p>
                            </div>
                        </div>

                        <aside className="info-aside">
                            <div className="info-miniCard">
                                <div className="info-miniTitle">Podporované dáta</div>
                                <div className="info-tags">
                                    <span className="info-tag">GPS</span>
                                    <span className="info-tag">Teplota</span>
                                    <span className="info-tag">Tlak</span>
                                    <span className="info-tag">Výška</span>
                                    <span className="info-tag">Akcelerácia</span>
                                    <span className="info-tag">Turbulencia</span>
                                </div>
                            </div>

                            <div className="info-miniCard">
                                <div className="info-miniTitle">Bezpečnostná poznámka</div>
                                <ul className="info-miniList">
                                    <li><strong>DEVICE_KEY</strong> je citlivý údaj.</li>
                                    <li>Ulož ho bezpečne, ideálne mimo verejných kanálov.</li>
                                    <li>Nezdieľaj ho verejne ani neukladaj do verejných repozitárov.</li>
                                </ul>
                            </div>

                            <div className="info-miniCard">
                                <div className="info-miniTitle">Ďalší krok</div>
                                <div className="info-ctaCol">
                                    <button className="info-btn" onClick={() => navigate("/login")}>Prihlásiť sa</button>
                                    <button className="info-btn info-btn--ghost" onClick={() => navigate("/home")}>Späť na Home</button>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>
        </main>
    );
}
