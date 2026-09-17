"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

export function UploadModal({
  open,
  title = "Upload listening history",
  dismissible = true,
  onClose,
  children,
}: {
  open: boolean;
  title?: string;
  dismissible?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissible) onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    const focusable = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, dismissible]);

  if (!open) return null;

  return (
    <div className="upload-modal" role="presentation">
      {dismissible ? (
        <button
          type="button"
          className="upload-modal__backdrop upload-modal__backdrop--button"
          aria-label="Close upload dialog"
          onClick={onClose}
        />
      ) : (
        <div className="upload-modal__backdrop" aria-hidden="true" />
      )}
      <div
        ref={panelRef}
        className="upload-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="upload-modal__header">
          <h2 id={titleId} className="upload-modal__title">
            {title}
          </h2>
          {dismissible ? (
            <button
              type="button"
              className="spa-button spa-button--ghost upload-modal__close"
              onClick={onClose}
            >
              Close
            </button>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}
