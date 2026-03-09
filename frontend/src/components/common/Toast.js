import React from "react";

const variantClass = {
  info: "bg-[color:var(--color-info-soft)] text-[color:var(--color-info)]",
  success:
    "bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]",
  warning:
    "bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)]",
  danger:
    "bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)]",
};

function joinClasses(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Toast({ message, variant = "info" }) {
  if (!message) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center pointer-events-none">
      <div
        className={joinClasses(
          "pointer-events-auto px-4 py-2.5 rounded-full text-sm font-medium shadow-sm border border-white/40",
          variantClass[variant]
        )}
      >
        {message}
      </div>
    </div>
  );
}

export default Toast;


