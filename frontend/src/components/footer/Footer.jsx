import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PiGlobe, PiFacebookLogo, PiInstagramLogo } from 'react-icons/pi';
import './footer.css';

const Footer = () => {
    const navigate = useNavigate();

    return (
        <footer className="footer">
            <div className="footer-links">
                <span onClick={() => navigate('/home')}>Domov</span>
                <span onClick={() => navigate('/info')}>Info</span>
                <span onClick={() => navigate('/contact')}>Kontakt</span>
            </div>

            <div className="social-icons">
                <a href="https://www.fpvai.ukf.sk/sk/" target="_blank" rel="noreferrer">
                    <PiGlobe size={20} />
                </a>
                <a href="https://www.facebook.com/fpvai.ukf" target="_blank" rel="noreferrer">
                    <PiFacebookLogo size={20} />
                </a>
                <a href="https://www.instagram.com/fpvai.ukf/" target="_blank" rel="noreferrer">
                    <PiInstagramLogo size={20} />
                </a>
            </div>

            <div className="footer-copy">
                © 2026 All rights reserved - FDR Systems
            </div>
        </footer>
    );
};

export default Footer;
