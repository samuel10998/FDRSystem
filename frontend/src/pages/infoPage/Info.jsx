import React, { useEffect, useRef, useState } from "react";
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
        desc: "Webová aplikácia na analýzu letových dát z tvojho Flight Data Recorder zariadenia."
    },
    {
        img: Helicopter2,
        title: "FDR Systems",
        desc: "Vizualizácia trasy letu a senzorov v čase – rýchlo, prehľadne a bezpečne."
    },
    {
        img: cockpitHeli,
        title: "FDR Systems",
        desc: "Od základného reportu až po detailné grafy – všetko v jednom rozhraní."
    }
];

export default function Info() {
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
                        <h2 className="info-h2">Čo je FDR Systems?</h2>
                        <p className="info-lead">
                            FDR Systems je webová aplikácia, ktorá umožňuje nahratie letového záznamu z
                            Flight Data Recorder zariadenia a jeho následnú analýzu.
                            Cieľom je poskytnúť používateľovi rýchly prehľad o lete aj detailné dáta na jednom mieste.
                        </p>
                    </div>

                    <div className="info-grid">
                        {/* left: text */}
                        <div className="info-section">
                            <h3 className="info-h3">Ako to funguje</h3>
                            <p className="info-p">
                                Po nahratí súboru systém spracuje GPS a senzorické údaje, vypočíta základné metriky a zobrazí výsledky
                                vo forme prehľadného reportu. Vďaka tomu vieš rýchlo porovnať lety, nájsť zaujímavé úseky a analyzovať priebeh letu.
                            </p>

                            <h3 className="info-h3">Čo v aplikácii uvidíš</h3>
                            <ul className="info-list">
                                <li><strong>Mapu trasy letu</strong> z GPS súradníc</li>
                                <li><strong>Časové grafy</strong> (teplota, tlak, výška, turbulencia…)</li>
                                <li><strong>Štatistiky</strong> (min/max/priemer, dĺžka letu, vzdialenosť)</li>
                                <li><strong>Prehľadné reporty</strong> vhodné na archiváciu a porovnanie letov</li>
                            </ul>
                        </div>

                        {/* right: “quick facts” */}
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
                                <div className="info-miniTitle">Pre koho je to</div>
                                <ul className="info-miniList">
                                    <li>Piloti a nadšenci letectva</li>
                                    <li>Študenti / výskum</li>
                                    <li>Testovanie a porovnanie letov</li>
                                </ul>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>
        </main>
    );
}
