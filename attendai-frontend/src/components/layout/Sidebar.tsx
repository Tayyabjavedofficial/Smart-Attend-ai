"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon, Settings } from "lucide-react";
import { Logo } from "@/components/icons/Logo";
import { useProfile } from "@/lib/hooks";
import { cn } from "@/lib/cn";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  /** Optional group heading; consecutive items sharing a section render under one label. */
  section?: string;
}

export function Sidebar({
  navItems,
  user,
  roleLabel,
  roleSubtitle,
}: {
  navItems: NavItem[];
  user: { fullName: string; subtitle?: string; id?: string };
  roleLabel: string;
  roleSubtitle: string;
}) {
  const pathname = usePathname();
  const { data: profile } = useProfile();
  const avatar = profile?.avatar ?? null;
  const settingsHref = `/${roleLabel.toLowerCase()}/settings`;

  return (
    <aside className="hidden lg:flex w-[240px] shrink-0 flex-col glass-dark text-white/90 p-5 sticky top-4 self-start max-h-[calc(100vh-2rem)] rounded-3xl ml-4 mt-4 mb-4">
      <div className="flex items-center gap-2.5 mb-6 px-1">
        <Logo variant="mark" className="h-9 w-9" />
        <div className="flex flex-col leading-tight">
          <span className="font-display text-[1.25rem] tracking-tight">
            Attend<span className="italic text-brand-300">AI</span>
          </span>
          <span className="text-[0.6rem] uppercase tracking-[0.2em] text-white/40">Smart Attendance</span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto -mr-2 pr-2">
        {navItems.map((item, i) => {
          const active = pathname === item.href || (item.href !== "/" + roleLabel.toLowerCase() && pathname?.startsWith(item.href));
          const Icon = item.icon;
          const showSection = item.section && item.section !== navItems[i - 1]?.section;
          return (
            <div key={item.href}>
              {showSection ? (
                <p className="text-[0.6rem] uppercase tracking-[0.18em] text-white/35 px-2 mb-1.5 mt-3 first:mt-0">
                  {item.section}
                </p>
              ) : null}
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.875rem] transition-all relative",
                  active
                    ? "bg-white text-brand-700 font-medium shadow-glass"
                    : "text-white/75 hover:text-white hover:bg-white/10"
                )}
              >
                {active ? <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-brand-500" /> : null}
                <Icon className={cn("size-[18px] shrink-0 transition-transform group-hover:scale-110", active && "text-brand-600")} />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[0.65rem] font-semibold",
                    active ? "bg-brand-600 text-white" : "bg-brand-500 text-white"
                  )}>
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="mt-4 pt-4 border-t border-white/8">
        <p className="text-[0.6rem] uppercase tracking-[0.18em] text-white/40 px-2 mb-2">{roleLabel} Profile</p>
        <Link
          href={settingsHref}
          title="Edit your profile & settings"
          className={cn(
            "flex items-center gap-3 p-2 rounded-xl transition-colors",
            pathname?.startsWith(settingsHref) ? "bg-white/15" : "bg-white/5 hover:bg-white/10"
          )}
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="size-9 rounded-full object-cover ring-2 ring-white/20" />
          ) : (
            <div className="size-9 rounded-full bg-gradient-to-br from-brand-300 to-brand-500 flex items-center justify-center text-white text-sm font-medium ring-2 ring-white/20">
              {user.fullName.split(" ").map(n => n[0]).slice(0, 2).join("")}
            </div>
          )}
          <div className="flex-1 min-w-0 leading-tight">
            <p className="text-[0.78rem] font-medium truncate text-white">{user.fullName}</p>
            <p className="text-[0.66rem] text-white/50 truncate">{roleSubtitle}</p>
          </div>
          <Settings className="size-4 text-white/40" />
        </Link>
      </div>
    </aside>
  );
}
