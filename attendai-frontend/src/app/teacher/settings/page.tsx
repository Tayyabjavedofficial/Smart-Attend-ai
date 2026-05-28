"use client";

import { Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccountSettings } from "@/components/settings/AccountSettings";

export default function TeacherSettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your account."
        icon={Settings}
        crumbs={[{ label: "Teacher", href: "/teacher" }, { label: "Settings" }]}
      />
      <AccountSettings />
    </>
  );
}
