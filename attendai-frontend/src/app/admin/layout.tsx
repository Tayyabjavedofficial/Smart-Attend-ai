"use client";

import { useMemo } from "react";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Layers, Link2, UserPlus,
  AlertTriangle, ShieldCheck, FileBarChart, Settings, Megaphone, Bell, LifeBuoy, UserCheck,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { NavItem } from "@/components/layout/Sidebar";
import { usePendingStudents } from "@/lib/hooks";

function buildNav(pendingCount: number): NavItem[] {
  return [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, section: "Overview" },
    { href: "/admin/students", label: "Students", icon: Users, section: "Manage" },
    { href: "/admin/approvals", label: "Approvals", icon: UserCheck, badge: pendingCount || undefined, section: "Manage" },
    { href: "/admin/teachers", label: "Teachers", icon: GraduationCap, section: "Manage" },
    { href: "/admin/courses", label: "Courses", icon: BookOpen, section: "Manage" },
    { href: "/admin/sections", label: "Sections", icon: Layers, section: "Manage" },
    { href: "/admin/assignments", label: "Assignments", icon: Link2, section: "Manage" },
    { href: "/admin/enrollments", label: "Enrollments", icon: UserPlus, section: "Manage" },
    { href: "/admin/announcements", label: "Announcements", icon: Megaphone, section: "Engage" },
    { href: "/admin/notifications", label: "Notifications", icon: Bell, section: "Engage" },
    { href: "/admin/alerts", label: "Proxy Alerts", icon: AlertTriangle, section: "Security" },
    { href: "/admin/devices", label: "Devices", icon: ShieldCheck, section: "Security" },
    { href: "/admin/reports", label: "Reports", icon: FileBarChart, section: "Insights" },
    { href: "/admin/help", label: "Help", icon: LifeBuoy, section: "Account" },
    { href: "/admin/settings", label: "Settings", icon: Settings, section: "Account" },
  ];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: pending = [] } = usePendingStudents();
  const nav = useMemo(() => buildNav(pending.length), [pending.length]);

  return (
    <DashboardLayout
      navItems={nav}
      roleLabel="Admin"
      roleSubtitle="System Administrator"
      requireRole="ADMIN"
    >
      {children}
    </DashboardLayout>
  );
}
