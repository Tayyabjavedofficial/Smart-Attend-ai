import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-5 transition-shadow hover:shadow-glass-lg",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-4", className)}>
      <div className="min-w-0">
        <h3 className="text-base font-medium text-ink-900 truncate">{title}</h3>
        {subtitle ? <p className="text-xs text-ink-400 mt-0.5">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}
