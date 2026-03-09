import React from "react";

export function LoadingSpinner({ label = "Đang tải dữ liệu..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="w-8 h-8 border-2 border-[color:var(--color-primary-light)] border-t-[color:var(--color-primary)] rounded-full animate-spin" />
      <p className="text-xs text-[color:var(--color-text-muted)]">{label}</p>
    </div>
  );
}

export default LoadingSpinner;


