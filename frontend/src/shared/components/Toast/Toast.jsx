import React from "react";
import "./Toast.css";

const variantClass = {
  info: "mc-toast__content--info",
  success: "mc-toast__content--success",
  warning: "mc-toast__content--warning",
  danger: "mc-toast__content--danger",
};

function joinClasses(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Toast({ message, variant = "info" }) {
  if (!message) return null;

  return (
    <div className="mc-toast">
      <div className={joinClasses("mc-toast__content", variantClass[variant])}>
        {message}
      </div>
    </div>
  );
}

export default Toast;
