"use client";

import { Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccountSettings } from "@/components/settings/AccountSettings";

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your account."
        icon={Settings}
        crumbs={[{ label: "Admin", href: "/admin" }, { label: "Settings" }]}
      />
      <AccountSettings />
    </>
  );
}
