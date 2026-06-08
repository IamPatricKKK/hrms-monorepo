"use client";

import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  user: { username: string; role: string; full_name: string | null };
}

export function Topbar({ user }: TopbarProps) {
  const router = useRouter();
  const initial = user.username.charAt(0).toUpperCase();

  function logout() {
    clearSession();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-end gap-3 border-b bg-white px-6 shadow-sm">
      <div className="flex items-center gap-3 text-sm">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-semibold text-white">
          {initial}
        </div>
        <div className="leading-tight">
          <div className="font-semibold">{user.full_name || user.username}</div>
          <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold uppercase text-primary">
            {user.role}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          Đăng xuất
        </Button>
      </div>
    </header>
  );
}
