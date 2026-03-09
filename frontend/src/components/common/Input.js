import React from "react";

function joinClasses(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Input({ label, error, hint, className, ...props }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="mc-field-label">{label}</span>}
      <input
        className={joinClasses(
          "mc-input",
          error
            ? "mc-input-error"
            : "",
          className
        )}
        {...props}
      />
      {error ? (
        <span className="mc-field-error">{error}</span>
      ) : (
        hint && <span className="mc-field-hint">{hint}</span>
      )}
    </label>
  );
}

export default Input;


