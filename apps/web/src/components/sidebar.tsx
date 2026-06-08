"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem { href: string; label: string; }
interface NavGroup { title: string; items: NavItem[]; roles?: string[]; }

const GROUPS: NavGroup[] = [
  { title: "Tổng quan", items: [{ href: "/dashboard", label: "Dashboard" }] },
  {
    title: "Nhân sự",
    roles: ["ADMIN", "HR"],
    items: [
      { href: "/employees", label: "Hồ sơ nhân viên" },
      { href: "/attendance", label: "Chấm công" },
      { href: "/attendance/summary", label: "Tổng hợp công" },
    ],
  },
  {
    title: "Lương & Phép",
    roles: ["ADMIN", "HR"],
    items: [
      { href: "/payroll", label: "Bảng lương" },
      { href: "/payroll/calculate", label: "Tính lương" },
      { href: "/leaves/approve", label: "Phê duyệt nghỉ phép" },
      { href: "/leaves", label: "Tất cả đơn nghỉ" },
    ],
  },
  {
    title: "Cá nhân",
    roles: ["EMPLOYEE"],
    items: [
      { href: "/leaves", label: "Đơn nghỉ của tôi" },
      { href: "/leaves/new", label: "+ Gửi đơn nghỉ phép" },
      { href: "/me/payslip", label: "Bảng lương của tôi" },
    ],
  },
  {
    title: "Quản trị",
    roles: ["ADMIN"],
    items: [
      { href: "/admin/users", label: "Tài khoản" },
      { href: "/admin/departments", label: "Phòng ban" },
      { href: "/admin/positions", label: "Chức vụ" },
    ],
  },
];

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-20 w-60 overflow-y-auto bg-sidebar text-sidebar-foreground">
      <div className="border-b border-white/10 px-5 py-5">
        <h1 className="text-lg font-bold text-white">HRMS</h1>
        <p className="text-xs text-slate-400">Quản lý nhân sự v1.0</p>
      </div>

      <nav className="px-3 py-3">
        {GROUPS.filter((g) => !g.roles || g.roles.includes(role || "")).map((group) => (
          <div key={group.title} className="mb-2">
            <h3 className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {group.title}
            </h3>
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-slate-700 text-white"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
