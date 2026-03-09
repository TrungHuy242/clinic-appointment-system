import React from "react";

const variantClass = {
  neutral:
    "bg-slate-100 text-slate-700 border border-slate-200",
  success:
    "bg-[color:var(--color-success-soft)] text-[color:var(--color-success)] border border-[color:var(--color-success-soft)]",
  warning:
    "bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)] border border-[color:var(--color-warning-soft)]",
  danger:
    "bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)] border border-[color:var(--color-danger-soft)]",
  info:
    "bg-[color:var(--color-info-soft)] text-[color:var(--color-info)] border border-[color:var(--color-info-soft)]",
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


