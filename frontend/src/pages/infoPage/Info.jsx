import React from "react";
import { FaPlane, FaCloudUploadAlt, FaMapMarkedAlt } from "react-icons/fa";
import "./info.css";

const Info = () => {
    return (
        <div className="info-page">
            <div className="info-header">
                <img
                    src="https://i.imgur.com/V3wyoCu.jpeg"
                    alt="Company Logo"
                    className="logo"
                />
                <h1>Naše služby</h1>
                <p className="info-description">
                    Špecializujeme sa na spracovanie a analýzu letových údajov. Ponúkame unikátne riešenie, ktoré vám
                    umožní nahrať údaje zo zapisovačov na našu platformu, kde získate štatistiky o svojich letoch,
                    vizualizácie na mapách a mnoho ďalších užitočných informácií.
                </p>
            </div>
            <div className="info-cards">
                <div className="info-card">
                    <div className="icon-wrapper">
                        <FaPlane className="contact-icon" />
                    </div>
                    <h2>Pre majiteľov lietadiel</h2>
                    <p>
                        Ponúkame služby šité na mieru majiteľom osobných lietadiel, ktoré vám umožnia sledovať a analyzovať vaše lety.
                    </p>
                </div>
                <div className="info-card">
                    <div className="icon-wrapper">
                        <FaCloudUploadAlt className="contact-icon" />
                    </div>
                    <h2>Upload dát</h2>
                    <p>
                        Nahrajte údaje zo zapisovačov priamo na našu platformu. Rýchle, jednoduché a bezpečné.
                    </p>
                </div>
                <div className="info-card">
                    <div className="icon-wrapper">
                        <FaMapMarkedAlt className="contact-icon" />
                    </div>
                    <h2>Vizualizácie letov</h2>
                    <p>
                        Prezrite si podrobné trasy svojich letov na interaktívnej mape a získajte dôležité štatistiky.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Info;
