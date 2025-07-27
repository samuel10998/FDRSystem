import React from 'react';
import './contact.css';
import Swal from 'sweetalert2';

const Contact = () => {
    const onSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);

        formData.append("access_key", "50da1da7-98c3-4e2d-ab8b-677becda3980");

        const object = Object.fromEntries(formData);
        const json = JSON.stringify(object);

        const res = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: json
        }).then((res) => res.json());

        if (res.success) {
            Swal.fire({
                title: "Dobrá práca!",
                text: "Tvoja správa bola odoslaná!",
                icon: "success"
            });
        }
    };

    return (
        <section className="contact">
            <div className="contact-container">
                <div className="contact-info">
                    <h2>Kontaktujte nás</h2>
                    <p>Email: <strong>info@skola.sk</strong></p>
                    <p>Telefón: <strong>+421 123 456 789</strong></p>
                </div>
                <div className="contact-form">
                    <form onSubmit={onSubmit}>
                        <h2>Kontakt fórum</h2>
                        <div className="input-box">
                            <label>Celé meno</label>
                            <input type="text" className="field" placeholder="Zadaj svoje meno" name="meno" required />
                        </div>
                        <div className="input-box">
                            <label>Emailová adresa</label>
                            <input type="email" className="field" placeholder="Zadaj svoj email" name="email" required />
                        </div>
                        <div className="input-box">
                            <label>Tvoja správa</label>
                            <textarea name="message" className="field mess" placeholder="Zadaj svoju správu" required></textarea>
                        </div>
                        <button type="submit">Send Message</button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Contact;
