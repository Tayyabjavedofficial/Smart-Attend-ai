"use client";

import {
  LayoutDashboard, BookOpen, Radio, ClipboardList, Bell, Settings, ScanFace,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { NavItem } from "@/components/layout/Sidebar";
import { SessionNotifier } from "@/components/student/SessionNotifier";

const nav: NavItem[] = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/courses", label: "My Courses", icon: BookOpen },
  { href: "/student/attendance", label: "Mark Attendance", icon: Radio },
  { href: "/student/history", label: "Attendance History", icon: ClipboardList },
  { href: "/student/face", label: "Face Profile", icon: ScanFace },
  { href: "/student/notifications", label: "Notifications", icon: Bell, badge: 2 },
  { href: "/student/settings", label: "Settings", icon: Settings },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      navItems={nav}
      roleLabel="Student"
      roleSubtitle="Computer Science · Sem 7"
      requireRole="STUDENT"
    >
      <SessionNotifier />
      {children}
    </DashboardLayout>
  );
}
