"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, type NavItem } from "./Sidebar";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";
import { useAuthStore } from "@/store/authStore";
import { type Role } from "@/types/api";

interface Props {
  navItems: NavItem[];
  roleLabel: string;
  roleSubtitle: string;
  requireRole: Role;
  children: ReactNode;
}

export function DashboardLayout({ navItems, roleLabel, roleSubtitle, requireRole, children }: Props) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== requireRole) {
      router.replace(`/${user.role.toLowerCase()}`);
    }
  }, [user, requireRole, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex relative">
      <Sidebar
        navItems={navItems}
        user={{ fullName: user.fullName, subtitle: roleSubtitle, id: `ID-${String(user.id).padStart(4, "0")}` }}
        roleLabel={roleLabel}
        roleSubtitle={roleSubtitle}
      />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:py-6 lg:pr-6 lg:pl-4 relative z-10 animate-fade-up">
        {children}
      </main>
      <AssistantWidget role={requireRole} />
    </div>
  );
}
