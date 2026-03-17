import React from "react";
import "./Drawer.css";

function joinClasses(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Drawer({ open, side = "right", title, children, onClose }) {
  if (!open) return null;

  const sideClass =
    side === "left"
      ? "mc-drawer__panel--left"
      : side === "bottom"
      ? "mc-drawer__panel--bottom"
      : "mc-drawer__panel--right";

  return (
    <div className="mc-drawer">
      <div className="mc-drawer__backdrop" onClick={onClose} />
      <div className={joinClasses("mc-drawer__panel", sideClass)}>
        <div className="mc-drawer__header">
          <h2 className="mc-drawer__title">{title}</h2>
          <button type="button" onClick={onClose} className="mc-drawer__close">
            ?
          </button>
        </div>
        <div className="mc-drawer__body">{children}</div>
      </div>
    </div>
  );
}

export default Drawer;
