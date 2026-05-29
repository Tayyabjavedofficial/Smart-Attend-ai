"use client";

import {
  LayoutDashboard, BookOpen, Radio, ClipboardList, Bell, Settings, ScanFace,
  CalendarDays, Megaphone, LifeBuoy,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { NavItem } from "@/components/layout/Sidebar";
import { SessionNotifier } from "@/components/student/SessionNotifier";

const nav: NavItem[] = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard, section: "Overview" },
  { href: "/student/attendance", label: "Mark Attendance", icon: Radio, section: "Attend" },
  { href: "/student/schedule", label: "Schedule", icon: CalendarDays, section: "Attend" },
  { href: "/student/courses", label: "My Courses", icon: BookOpen, section: "Attend" },
  { href: "/student/history", label: "Attendance History", icon: ClipboardList, section: "Attend" },
  { href: "/student/announcements", label: "Announcements", icon: Megaphone, section: "Engage" },
  { href: "/student/notifications", label: "Notifications", icon: Bell, badge: 2, section: "Engage" },
  { href: "/student/face", label: "Face Profile", icon: ScanFace, section: "Account" },
  { href: "/student/help", label: "Help", icon: LifeBuoy, section: "Account" },
  { href: "/student/settings", label: "Settings", icon: Settings, section: "Account" },
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
