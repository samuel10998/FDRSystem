import React from "react";
import { Link } from "react-router-dom"; // Import Link
import "./home.css";

const Home = () => {
    return (
        <div className="home-wrapper">
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
                        <Link to="/auth/login">
                            <button className="cta-button">Zaregistrujte sa teraz</button>
                        </Link>
                    </div>
                </div>
                <div className="image-container">
                    <img
                        src="https://www.l3harris.com/sites/default/files/styles/625_x_570/public/2020-08/as-cas-product-cockpit-voice-and-data-recorders.jpg?itok=0Hg7eROr"
                        alt="Flight Data Visualization"
                    />
                </div>
            </div>
        </div>
    );
};

export default Home;
