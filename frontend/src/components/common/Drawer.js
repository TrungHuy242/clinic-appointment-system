import React from "react";

function joinClasses(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Drawer({ open, side = "right", title, children, onClose }) {
  if (!open) return null;

  const sideClass =
    side === "left"
      ? "left-0 border-r"
      : side === "bottom"
      ? "inset-x-0 bottom-0 border-t max-h-[80vh]"
      : "right-0 border-l";

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div
        className={joinClasses(
          "relative z-50 w-full max-w-md bg-[color:var(--color-surface)] shadow-[var(--shadow-md)] border-[color:var(--color-border-subtle)]",
          sideClass
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--color-border-subtle)]">
          <h2 className="text-sm font-semibold text-[color:var(--color-text-main)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-bg-soft)]"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(100vh-56px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Drawer;


