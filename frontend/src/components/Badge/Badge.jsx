import React from "react";
import "./Badge.css";

const variantClass = {
  neutral: "mc-badge-neutral",
  success: "mc-badge-success",
  warning: "mc-badge-warning",
  danger: "mc-badge-danger",
  info: "mc-badge-info",
};

function joinClasses(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Badge({ children, variant = "neutral", className }) {
  return (
    <span
      className={joinClasses(
        "mc-badge",
        variantClass[variant] || variantClass.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
