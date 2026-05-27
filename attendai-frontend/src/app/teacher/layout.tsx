"use client";

import {
  LayoutDashboard, Radio, BookOpen, Users, FileBarChart,
  PieChart, Bell, Settings,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { NavItem } from "@/components/layout/Sidebar";

const nav: NavItem[] = [
  { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/sessions", label: "Attendance Sessions", icon: Radio },
  { href: "/teacher/courses", label: "Courses", icon: BookOpen },
  { href: "/teacher/students", label: "Students", icon: Users },
  { href: "/teacher/reports", label: "Reports", icon: FileBarChart },
  { href: "/teacher/analytics", label: "Analytics", icon: PieChart },
  { href: "/teacher/alerts", label: "Alerts", icon: Bell, badge: 3 },
  { href: "/teacher/settings", label: "Settings", icon: Settings },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      navItems={nav}
      roleLabel="Teacher"
      roleSubtitle="Computer Science"
      requireRole="TEACHER"
    >
      {children}
    </DashboardLayout>
  );
}
