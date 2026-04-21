import React from "react";
import "./Input.css";

function joinClasses(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Input({ label, error, hint, className, ...props }) {
  return (
    <label className="mc-field">
      {label && <span className="mc-field-label">{label}</span>}
      <input
        className={joinClasses(
          "mc-input",
          error ? "mc-input-error" : "",
          className
        )}
        value={props.value == null ? "" : props.value}
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
