"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, className, id, type = "text", ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    const isPassword = type === "password";
    const [revealed, setRevealed] = useState(false);
    const effectiveType = isPassword && revealed ? "text" : type;

    return (
      <div className="space-y-1.5">
        {label ? (
          <label htmlFor={inputId} className="block text-xs font-medium text-ink-500 uppercase tracking-wide">
            {label}
          </label>
        ) : null}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            className={cn(
              "block w-full h-11 px-3.5 rounded-xl bg-white/70 border text-sm text-ink-900",
              "placeholder:text-ink-300",
              "outline-none transition-all duration-200",
              "focus:bg-white focus:ring-2 focus:ring-brand-500/30",
              error
                ? "border-accent-rose/60 focus:border-accent-rose focus:ring-accent-rose/20"
                : "border-ink-200/60 focus:border-brand-500",
              isPassword && "pr-11",
              className
            )}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              onClick={() => setRevealed(r => !r)}
              aria-label={revealed ? "Hide password" : "Show password"}
              aria-pressed={revealed}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-400 hover:text-ink-600 transition-colors"
            >
              {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          ) : null}
        </div>
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
