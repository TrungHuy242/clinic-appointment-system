import React from "react";
import "./LoadingSpinner.css";

export function LoadingSpinner({ label = "Đang tải dữ liệu..." }) {
  return (
    <div className="mc-loading-spinner">
      <div className="mc-loading-spinner__ring" />
      <p className="mc-loading-spinner__label">{label}</p>
    </div>
  );
}

export default LoadingSpinner;
