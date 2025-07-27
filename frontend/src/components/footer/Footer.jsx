import React from 'react';
import { PiGlobe, PiFacebookLogo, PiInstagramLogo } from 'react-icons/pi';  // Import ikony glóbusu a ostatných ikon

import './footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-left">
                    <p>Táto platforma slúži na nahrávanie, správu a analýzu letových záznamov.
                        Nahrajte svoje dáta, prezrite si trasu letu na mape a vytvárajte rôzne štatistiky.
                        Sme radi, že ste tu, a tešíme sa na vaše príspevky!</p>
                    <button className="project-button">Pridajte sa k nám</button>
                </div>
                <div className="footer-right">
                    <p>Email: <a href="mailto:info@fdr.sk">info@skola.sk</a></p>
                    <p>Telefón: <a href="tel:+421123456789">+421 123 456 789</a></p>
                    <p>Adresa: Tr. A. Hlinku 1, 949 01 Nitra, Slovensko</p>
                    <div className="social-icons">
                        {/* Zmenená ikona Discordu na PiGlobe */}
                        <a href="https://www.fpvai.ukf.sk/sk/" target="_blank" rel="noopener noreferrer">
                            <PiGlobe size={30} />
                        </a>
                        {/* Facebook a Instagram ikony */}
                        <a href="https://www.facebook.com/fpvai.ukf" target="_blank" rel="noopener noreferrer">
                            <PiFacebookLogo size={30} />
                        </a>
                        <a href="https://www.instagram.com/fpvai.ukf/" target="_blank" rel="noopener noreferrer">
                            <PiInstagramLogo size={30} />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;