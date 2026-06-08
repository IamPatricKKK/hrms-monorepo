"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiPost, ApiError } from "@/lib/api";
import { setSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/misc";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPost<{ access_token: string; user: any }>(
        "/auth/login",
        { username, password },
      );
      setSession(data.access_token, data.user);
      toast.success(`Xin chào ${data.user.username}!`);
      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : "Đăng nhập thất bại";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary to-slate-900 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
        <h1 className="mb-1 text-2xl font-bold text-primary">HRMS · Đăng nhập</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Hệ thống quản lý nhân sự - Demo môn Kiểm thử &amp; Kiểm soát chất lượng phần mềm.
        </p>

        {error && (
          <div className="mb-4 rounded-md border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate>
          <div className="mb-4">
            <Label htmlFor="username" required>Tên đăng nhập</Label>
            <Input
              id="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="password" required>Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>

        <div className="mt-6 rounded-md border border-dashed bg-slate-50 p-3 text-xs text-slate-600">
          <p className="mb-2 font-semibold text-slate-700">Tài khoản demo:</p>
          <ul className="space-y-0.5 font-mono">
            <li>• admin / Admin123 (ADMIN)</li>
            <li>• hr01 / Hr012345 (HR)</li>
            <li>• nv002 / Nv002345 (EMPLOYEE - Trần Văn An)</li>
            <li>• user01 / User1234 (Đã khóa - TC-08)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
