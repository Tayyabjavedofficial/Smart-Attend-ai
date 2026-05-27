import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface Props {
  label: string;
  value: string | number;
  caption?: string;
  delta?: { value: string; direction: "up" | "down" };
  icon: LucideIcon;
  accent?: "brand" | "blue" | "amber" | "rose";
  chip?: { label: string; tone?: "live" | "neutral" };
}

const accents = {
  brand: "bg-brand-50 text-brand-700",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
} as const;

export function StatCard({ label, value, caption, delta, icon: Icon, accent = "brand", chip }: Props) {
  return (
    <div className="glass rounded-2xl p-5 group hover:shadow-glass-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className={cn(
          "size-12 shrink-0 rounded-full grid place-items-center",
          accents[accent]
        )}>
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-ink-500 font-medium">{label}</p>
            {chip ? (
              <span className={cn(
                "text-[0.6rem] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded",
                chip.tone === "live" ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600"
              )}>
                {chip.tone === "live" ? <span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full bg-white dot-live" />{chip.label}</span> : chip.label}
              </span>
            ) : null}
          </div>
          <p className="mt-1 font-display text-[2rem] leading-none text-ink-900 numeral">{value}</p>
          {caption ? (
            <p className="mt-1.5 text-[0.72rem] text-ink-400 truncate">{caption}</p>
          ) : null}
          {delta ? (
            <p className={cn(
              "mt-2 inline-flex items-center gap-1 text-[0.72rem] font-medium",
              delta.direction === "up" ? "text-brand-600" : "text-accent-rose"
            )}>
              {delta.direction === "up" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {delta.value}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
