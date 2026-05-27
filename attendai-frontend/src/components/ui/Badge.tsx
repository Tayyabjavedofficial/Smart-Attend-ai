import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "live";

const tones: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-700 ring-1 ring-ink-200/60",
  success: "bg-brand-50 text-brand-700 ring-1 ring-brand-200/60",
  warning: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/60",
  danger: "bg-rose-50 text-rose-800 ring-1 ring-rose-200/60",
  info: "bg-blue-50 text-blue-800 ring-1 ring-blue-200/60",
  live: "bg-brand-600 text-white ring-1 ring-brand-700",
};

export function Badge({ tone = "neutral", children, dot = false }: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.7rem] font-medium",
        tones[tone]
      )}
    >
      {dot ? (
        <span className={cn("size-1.5 rounded-full", tone === "live" ? "bg-white dot-live" : "bg-current")} />
      ) : null}
      {children}
    </span>
  );
}
