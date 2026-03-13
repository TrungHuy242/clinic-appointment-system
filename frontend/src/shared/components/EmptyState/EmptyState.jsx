import React from "react";
import { Inbox } from "lucide-react";
import Button from "../Button/Button";
import "./EmptyState.css";

export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="mc-empty-state">
      <div className="mc-empty-state__icon">
        <Inbox className="mc-icon mc-icon--lg" />
      </div>
      {title && <h3 className="mc-empty-state__title">{title}</h3>}
      {description && <p className="mc-empty-state__description">{description}</p>}
      {actionLabel && onAction && (
        <Button size="sm" variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;