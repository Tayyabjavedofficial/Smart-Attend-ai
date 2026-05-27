"use client";

import { Calendar, Megaphone, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";

interface Props {
  title: string;
  greeting?: string;
  actionLabel?: string;
  actionIcon?: typeof Megaphone;
  dateLabel?: string;
}

export function Topbar({
  title,
  greeting,
  actionLabel = "New Announcement",
  actionIcon: ActionIcon = Megaphone,
  dateLabel,
}: Props) {
  const today = new Date();
  const formatted =
    dateLabel ??
    today.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  const handleLogout = async () => {
    try {
      if (refreshToken) await api.auth.logout(refreshToken);
    } catch {
      // ignore - still clear locally
    }
    clear();
    router.replace("/login");
  };

  return (
    <header className="flex flex-col gap-4 mb-8 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="font-display text-[2.5rem] leading-[1.05] tracking-tight text-ink-900">
          {title}
        </h1>
        {greeting ? (
          <p className="mt-1 text-sm text-ink-500 balance">{greeting}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-2.5">
        <div className="glass rounded-xl h-10 px-3.5 flex items-center gap-2 text-sm text-ink-700">
          <Calendar className="size-4 text-brand-600" />
          <span className="font-medium">{formatted}</span>
        </div>
        <Button variant="dark">
          <ActionIcon className="size-4" />
          {actionLabel}
        </Button>
        <Button variant="ghost" size="md" onClick={handleLogout} aria-label="Log out">
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
