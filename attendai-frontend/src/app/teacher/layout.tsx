"use client";

import {
  LayoutDashboard, Radio, BookOpen, Users, FileBarChart,
  PieChart, Bell, Settings, CalendarDays, Megaphone, ShieldAlert, LifeBuoy,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { NavItem } from "@/components/layout/Sidebar";

const nav: NavItem[] = [
  { href: "/teacher", label: "Dashboard", icon: LayoutDashboard, section: "Overview" },
  { href: "/teacher/sessions", label: "Attendance Sessions", icon: Radio, section: "Teach" },
  { href: "/teacher/schedule", label: "Schedule", icon: CalendarDays, section: "Teach" },
  { href: "/teacher/courses", label: "Courses", icon: BookOpen, section: "Teach" },
  { href: "/teacher/students", label: "Students", icon: Users, section: "Teach" },
  { href: "/teacher/announcements", label: "Announcements", icon: Megaphone, section: "Engage" },
  { href: "/teacher/notifications", label: "Notifications", icon: Bell, section: "Engage" },
  { href: "/teacher/analytics", label: "Analytics", icon: PieChart, section: "Insights" },
  { href: "/teacher/reports", label: "Reports", icon: FileBarChart, section: "Insights" },
  { href: "/teacher/alerts", label: "Proxy Alerts", icon: ShieldAlert, badge: 3, section: "Insights" },
  { href: "/teacher/help", label: "Help", icon: LifeBuoy, section: "Account" },
  { href: "/teacher/settings", label: "Settings", icon: Settings, section: "Account" },
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
