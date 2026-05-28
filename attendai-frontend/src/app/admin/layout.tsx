"use client";

import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Layers, Link2, UserPlus,
  AlertTriangle, ShieldCheck, FileBarChart, Settings,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { NavItem } from "@/components/layout/Sidebar";

const nav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/sections", label: "Sections", icon: Layers },
  { href: "/admin/assignments", label: "Assignments", icon: Link2 },
  { href: "/admin/enrollments", label: "Enrollments", icon: UserPlus },
  { href: "/admin/alerts", label: "Proxy Alerts", icon: AlertTriangle, badge: 5 },
  { href: "/admin/devices", label: "Devices", icon: ShieldCheck },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
