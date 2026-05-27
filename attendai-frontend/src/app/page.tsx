"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(`/${user.role.toLowerCase()}`);
  }, [user, router]);

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-ink-400 font-display text-xl">Loading…</div>
    </div>
  );
}
