"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    return (
      <div className="space-y-1.5">
        {label ? (
          <label htmlFor={inputId} className="block text-xs font-medium text-ink-500 uppercase tracking-wide">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "block w-full h-11 px-3.5 rounded-xl bg-white/70 border text-sm text-ink-900",
            "placeholder:text-ink-300",
            "outline-none transition-all duration-200",
            "focus:bg-white focus:ring-2 focus:ring-brand-500/30",
            error
              ? "border-accent-rose/60 focus:border-accent-rose focus:ring-accent-rose/20"
              : "border-ink-200/60 focus:border-brand-500",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-accent-rose">{error}</p>
        ) : hint ? (
          <p className="text-xs text-ink-400">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
