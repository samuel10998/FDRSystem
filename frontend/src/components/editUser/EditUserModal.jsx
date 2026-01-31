import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EditUserDialog from "./EditUserDialog";
import "./editUserModal.css";

export default function EditUserModal() {
    const navigate = useNavigate();

    const close = () => navigate(-1);

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") close();
        };
        window.addEventListener("keydown", onKeyDown);

        // lock scroll
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

                {/* isModal → upraví padding/background v CSS + správanie po uložení */}
                <EditUserDialog isModal />
            </div>
        </div>
    );
}
