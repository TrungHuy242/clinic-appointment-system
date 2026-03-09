import React from "react";
import Button from "./Button";

export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="w-16 h-16 rounded-full bg-[color:var(--color-bg-soft)] flex items-center justify-center text-2xl">
        🩺
      </div>
      {title && (
        <h3 className="text-sm font-semibold text-[color:var(--color-text-main)]">
          {title}
        </h3>
      )}
      {description && (
        <p className="max-w-sm text-xs text-[color:var(--color-text-muted)]">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button size="sm" variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;


