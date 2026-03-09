import React from "react";

function joinClasses(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}) {
  const classes = joinClasses(
    "mc-btn",
    size === "sm" ? "mc-btn-sm" : size === "lg" ? "mc-btn-lg" : "mc-btn-md",
    variant === "secondary"
      ? "mc-btn-secondary"
      : variant === "ghost"
      ? "mc-btn-ghost"
      : variant === "danger"
      ? "mc-btn-danger"
      : "mc-btn-primary",
    className
  );

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export default Button;



