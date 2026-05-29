"use client";

import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  footer?: ReactNode;
}) {
  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    // Lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
  } as const;

  // Portal to <body> so position:fixed is relative to the viewport, not a
  // transformed/filtered ancestor (the dashboard layout uses backdrop-filter,
  // which would otherwise offset a fixed child toward the bottom).
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-900/30 backdrop-blur-md"
        onClick={onClose}
      />
      {/* Panel */}
      <div className={cn("relative w-full max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-glass-lg ring-1 ring-ink-200/60 animate-fade-up", sizes[size])}>
        <div className="flex items-start justify-between gap-4 p-5 pb-3">
          <div>
            <h3 className="font-display text-[1.5rem] leading-tight text-ink-900">{title}</h3>
            {description ? <p className="text-sm text-ink-500 mt-1">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 grid place-items-center rounded-lg hover:bg-ink-100 text-ink-400 hover:text-ink-700 transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 pb-5">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-ink-100 bg-canvas/40 rounded-b-2xl sticky bottom-0">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
