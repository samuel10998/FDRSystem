import React, { useRef, useState } from "react";
import "./contact.css";
import Swal from "sweetalert2";
import HCaptcha from "@hcaptcha/react-hcaptcha";

const Contact = () => {
    const captchaRef = useRef(null);

    // ✅ token v state (kvôli UI) + v ref (kvôli okamžitému čítaniu)
    const [hToken, setHToken] = useState("");
    const hTokenRef = useRef("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (event) => {
        event.preventDefault();

        const token = hTokenRef.current;

        // ✅ blokni submit bez tokenu
        if (!token) {
            Swal.fire({
                icon: "warning",
                title: "Captcha",
                text: "Prosím potvrď, že nie si robot.",
            });
            return;
        }

        if (isSubmitting) return;

        setIsSubmitting(true);

        const formData = new FormData(event.target);
        formData.append("access_key", "50da1da7-98c3-4e2d-ab8b-677becda3980");

        const object = Object.fromEntries(formData);

        // ✅ Web3Forms očakáva toto pole
        object["h-captcha-response"] = token;

        const json = JSON.stringify(object);

        try {
            const res = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: json,
            }).then((r) => r.json());

            if (res.success) {
                Swal.fire({
                    title: "Dobrá práca!",
                    text: "Tvoja správa bola odoslaná!",
                    icon: "success",
                });

                // ✅ reset form + captcha
                event.target.reset();
                setHToken("");
                hTokenRef.current = "";
                captchaRef.current?.resetCaptcha();
            } else {
                // ✅ ak by Web3Forms vrátil chybu na captcha / spam, radšej resetni token
                setHToken("");
                hTokenRef.current = "";
                captchaRef.current?.resetCaptcha();

                Swal.fire({
                    title: "Chyba",
                    text: res.message || "Odoslanie zlyhalo. Skús znova.",
                    icon: "error",
                });
            }
        } catch (e) {
            // ✅ pri network chybe tiež reset captcha token (aby user nemusel refresh)
            setHToken("");
            hTokenRef.current = "";
            captchaRef.current?.resetCaptcha();

            Swal.fire({
                title: "Chyba",
                text: "Nepodarilo sa odoslať správu. Skús znova.",
                icon: "error",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page-wrapper">
            <section className="contact">
                <div className="contact-container">
                    <div className="contact-info">
                        <h2>Kontaktujte nás</h2>
                        <p>
                            Email: <strong>info@skola.sk</strong>
                        </p>
                        <p>
                            Telefón: <strong>+421 123 456 789</strong>
                        </p>
                    </div>

                    <div className="contact-form">
                        <form onSubmit={onSubmit}>
                            <h2>Kontakt fórum</h2>

                            <div className="input-box">
                                <label>Celé meno</label>
                                <input
                                    type="text"
                                    className="field"
                                    placeholder="Zadaj svoje meno"
                                    name="meno"
                                    required
                                />
                            </div>

                            <div className="input-box">
                                <label>Emailová adresa</label>
                                <input
                                    type="email"
                                    className="field"
                                    placeholder="Zadaj svoj email"
                                    name="email"
                                    required
                                />
                            </div>

                            <div className="input-box">
                                <label>Tvoja správa</label>
                                <textarea
                                    name="message"
                                    className="field mess"
                                    placeholder="Zadaj svoju správu"
                                    required
                                ></textarea>
                            </div>

                            {/* ✅ hCaptcha */}
                            <div className="captcha-wrap">
                                <HCaptcha
                                    ref={captchaRef}
                                    sitekey="50b2fe65-b00b-4b9e-ad62-3ba471098be2"
                                    reCaptchaCompat={false}
                                    onVerify={(token) => {
                                        setHToken(token);
                                        hTokenRef.current = token; // ✅ okamžite dostupné v onSubmit
                                    }}
                                    onExpire={() => {
                                        setHToken("");
                                        hTokenRef.current = "";
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!hToken || isSubmitting}
                                title={!hToken ? "Najprv potvrď captcha" : undefined}
                            >
                                {isSubmitting ? "Odosielam..." : "Send Message"}
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
