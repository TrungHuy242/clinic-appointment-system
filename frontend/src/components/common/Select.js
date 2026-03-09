import React from "react";

function joinClasses(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Select({ label, error, hint, className, children, ...props }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="mc-field-label">{label}</span>}
      <select
        className={joinClasses(
          "mc-select",
          error ? "mc-select-error" : "",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <span className="mc-field-error">{error}</span>
      ) : (
        hint && <span className="mc-field-hint">{hint}</span>
      )}
    </label>
  );
}

export default Select;


