import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Register from "./Register";
import "./registerModal.css";

export default function RegisterModal() {
    const navigate = useNavigate();
    const close = () => navigate(-1);

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") close();
        };
        window.addEventListener("keydown", onKeyDown);

        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = prev;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="modalOverlay" onMouseDown={close}>
            <div className="modalCard" onMouseDown={(e) => e.stopPropagation()}>
                <button className="modalClose" onClick={close} aria-label="Zavrieť">
                    ✕
                </button>

                <Register isModal />
            </div>
        </div>
    );
}
