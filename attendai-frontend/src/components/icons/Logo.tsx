import { type SVGProps } from "react";

/**
 * AttendAI logo mark. A stylised "A" whose crossbar is a checkmark — embeds
 * the attendance concept (mark = check) into the wordmark's first letter.
 *
 * - `variant="mark"` renders only the icon (square)
 * - `variant="wordmark"` renders icon + "AttendAI" text
 */
export function Logo({
  variant = "wordmark",
  className,
  ...rest
}: { variant?: "mark" | "wordmark" } & SVGProps<SVGSVGElement>) {
  if (variant === "mark") {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...rest}
      >
        <defs>
          <linearGradient id="logoBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0A84FF" />
            <stop offset="60%" stopColor="#0066E6" />
            <stop offset="100%" stopColor="#003A85" />
          </linearGradient>
          <linearGradient id="logoInk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#EAF4FF" />
          </linearGradient>
        </defs>
        {/* Rounded-square plate with subtle gradient + inner highlight */}
        <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#logoBg)" />
        <rect
          x="2.5"
          y="2.5"
          width="59"
          height="59"
          rx="15.5"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
          fill="none"
        />
        {/* The "A" - two diagonal strokes */}
        <path
          d="M 19 48 L 32 16 L 45 48"
          stroke="url(#logoInk)"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* The checkmark crossbar - the conceptual core of the mark */}
        <path
          d="M 24 37 L 30 41 L 41 30"
          stroke="url(#logoInk)"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Tiny accent dot - the "AI eye" */}
        <circle cx="32" cy="11" r="2.2" fill="#FFFFFF" opacity="0.85" />
      </svg>
    );
  }
  return (
    <span className={["inline-flex items-center gap-2.5", className].filter(Boolean).join(" ")}>
      <Logo variant="mark" className="h-8 w-8" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.35rem] tracking-tight text-ink-900">
          Attend<span className="italic text-brand-600">AI</span>
        </span>
        <span className="text-[0.62rem] uppercase tracking-[0.16em] text-ink-400">
          Smart Attendance
        </span>
      </span>
    </span>
  );
}
