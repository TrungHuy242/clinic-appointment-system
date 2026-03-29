import React from "react";
import { X } from "lucide-react";
import Button from "../Button/Button";
import "./Modal.css";

function joinClasses(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Modal({ open, title, description, children, onClose, footer, size }) {
  if (!open) return null;

  return (
    <div className="mc-modal-backdrop">
      <div className="mc-modal-overlay" onClick={onClose} />
      <div className={joinClasses("mc-modal", size === "lg" ? "mc-modal--lg" : "")}>
        <div className="mc-modal-header">
          <div>
            {title && <h2 className="mc-modal-title">{title}</h2>}
            {description && <p className="mc-modal-description">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className={joinClasses("mc-modal-close")}>
            <X className="mc-icon mc-icon--sm" />
          </button>
        </div>

        <div className="mc-modal-body">{children}</div>

        <div className="mc-modal-footer">
          {footer || (
            <Button variant="secondary" size="sm" onClick={onClose}>
              Đóng
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Modal;
