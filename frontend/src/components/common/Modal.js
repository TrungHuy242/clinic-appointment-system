import React from "react";
import Button from "./Button";

function joinClasses(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Modal({ open, title, description, children, onClose, footer }) {
  if (!open) return null;

  return (
    <div className="mc-modal-backdrop">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="mc-modal">
        <div className="mc-modal-header">
          <div>
            {title && (
              <h2 className="mc-modal-title">
                {title}
              </h2>
            )}
            {description && (
              <p className="mc-modal-description">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={joinClasses("mc-modal-close")}
          >
            ✕
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


