"use client";

import { Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccountSettings } from "@/components/settings/AccountSettings";

export default function StudentSettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your account."
        icon={Settings}
        crumbs={[{ label: "Student", href: "/student" }, { label: "Settings" }]}
      />
      <AccountSettings />
    </>
  );
}
