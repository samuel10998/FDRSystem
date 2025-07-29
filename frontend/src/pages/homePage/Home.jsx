// Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./home.css";

const Home = () => {
    return (
        <div className="home-content">
            <div className="home-container">
                <div className="text-container">
                    <h1 className="home-title">Flight Data Recorder System</h1>
                    <p className="home-subtitle">
                        Spoľahlivé riešenie na správu, analýzu a vizualizáciu letových údajov.
                    </p>
                    <div className="home-description">
                        <h2>Presné letové dáta, vždy na dosah</h2>
                        <p>
                            Náš systém umožňuje používateľom efektívne nahrávať, spravovať a analyzovať letové záznamy. Sledujte teplotu, tlak, nadmorskú výšku, GPS súradnice a ďalšie parametre v jednom intuitívnom rozhraní.
                        </p>
                        <p>
                            Nahrajte svoje dáta, vizualizujte trasu letu a generujte podrobné štatistiky, ktoré vám pomôžu lepšie pochopiť každý aspekt vášho letu.
                        </p>
                        <Link to="/api/login">
                            <button className="cta-button">Zaregistrujte sa teraz</button>
                        </Link>
                    </div>
                </div>
                <div className="image-container">
                    <img
                        src="https://www.ntsb.gov/news/PublishingImages/cvr_sidefront_lg.jpg"
                        alt="Flight Data Visualization"
                    />
                </div>
            </div>

            <div className="features-section">
                <h2 className="features-title">Prečo si vybrať náš systém?</h2>
                <p className="features-description">
                    Náš systém prináša inovatívne riešenia, ktoré zvyšujú efektivitu a bezpečnosť vašich letových operácií.
                </p>
                <ul className="features-list">
                    <li>Jednoduché nahrávanie a spracovanie letových dát</li>
                    <li>Detailnú analýzu a vizualizáciu každého letu</li>
                    <li>Bezpečné uchovávanie dát a spoľahlivé výsledky</li>
                    <li>Intuitívne rozhranie pre rýchle získanie informácií</li>
                </ul>
            </div>
        </div>
    );
};

export default Home;
