"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Badge, Label, PageTitle } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Role } from "@hrms/shared";
import type { EmployeeDto, UserDto } from "@hrms/shared";
import { formatDate } from "@/lib/utils";

const ROLE_BADGE: Record<string, "destructive" | "primary" | "secondary"> = {
  ADMIN: "destructive", HR: "primary", EMPLOYEE: "secondary",
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(Role.EMPLOYEE);
  const [employeeId, setEmployeeId] = useState(0);
  const [resetting, setResetting] = useState<number | null>(null);
  const [newPw, setNewPw] = useState("");

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiGet<UserDto[]>("/users"),
  });
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-all-for-users"],
    queryFn: () => apiGet<{ items: EmployeeDto[] }>("/employees?page=1&page_size=100").then(r => r.items),
  });

  const create = useMutation({
    mutationFn: () => apiPost("/users", {
      username, password, role,
      employee_id: employeeId || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(`Đã tạo tài khoản ${username}`);
      setUsername(""); setPassword(""); setEmployeeId(0); setRole(Role.EMPLOYEE);
    },
    onError: (e: any) => toast.error(e instanceof ApiError ? e.message : "Lỗi"),
  });
  const toggleLock = useMutation({
    mutationFn: (id: number) => apiPost(`/users/${id}/toggle-lock`),
    onSuccess: (u: any) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(`Đã ${u.status === "locked" ? "khóa" : "mở khóa"} ${u.username}`);
    },
  });
  const resetPw = useMutation({
    mutationFn: (id: number) => apiPost(`/users/${id}/reset-password`, { new_password: newPw }),
    onSuccess: () => { toast.success("Đã đặt lại mật khẩu"); setResetting(null); setNewPw(""); },
    onError: (e: any) => toast.error(e instanceof ApiError ? e.message : "Lỗi"),
  });

  function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!username || !password) { toast.error("Vui lòng nhập đầy đủ"); return; }
    create.mutate();
  }

  return (
    <>
      <PageTitle title="Quản lý tài khoản" subtitle="Tạo, phân quyền, khóa/mở tài khoản." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[400px_1fr]">
        <Card>
          <CardHeader><CardTitle>Tạo tài khoản mới</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onCreate}>
              <div className="mb-3">
                <Label required>Username</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">4-20 ký tự, chỉ chữ và số</p>
              </div>
              <div className="mb-3">
                <Label required>Mật khẩu</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">≥ 8 ký tự, có chữ và số</p>
              </div>
              <div className="mb-3">
                <Label required>Vai trò</Label>
                <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="HR">HR</option>
                  <option value="ADMIN">ADMIN</option>
                </Select>
              </div>
              <div className="mb-3">
                <Label>Gắn với nhân viên</Label>
                <Select value={employeeId} onChange={(e) => setEmployeeId(Number(e.target.value))}>
                  <option value={0}>— Không gắn —</option>
                  {employees.map((e) => (
                    <option key={e.emp_id} value={e.emp_id}>{e.emp_code} · {e.full_name}</option>
                  ))}
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={create.isPending}>
                {create.isPending ? "Đang tạo..." : "Tạo tài khoản"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Danh sách tài khoản ({users.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR><TH>Username</TH><TH>Vai trò</TH><TH>Nhân viên</TH><TH>Trạng thái</TH><TH /></TR>
              </THead>
              <TBody>
                {users.map((u) => (
                  <TR key={u.user_id}>
                    <TD className="font-semibold">{u.username}</TD>
                    <TD><Badge variant={ROLE_BADGE[u.role] || "default"}>{u.role}</Badge></TD>
                    <TD>{u.employee?.full_name || "-"}</TD>
                    <TD>
                      {u.status === "active"
                        ? <Badge variant="success">Hoạt động</Badge>
                        : <Badge variant="destructive">Khóa</Badge>}
                      {u.locked_until && (
                        <div className="text-xs text-muted-foreground">tạm khóa đến {formatDate(u.locked_until)}</div>
                      )}
                    </TD>
                    <TD>
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => toggleLock.mutate(u.user_id)}>
                          {u.status === "active" ? "Khóa" : "Mở khóa"}
                        </Button>
                        {resetting !== u.user_id ? (
                          <Button size="sm" variant="outline" onClick={() => setResetting(u.user_id)}>Đặt lại MK</Button>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Input
                              className="h-8 max-w-[140px] text-xs"
                              type="password" value={newPw}
                              onChange={(e) => setNewPw(e.target.value)}
                              placeholder="MK mới"
                            />
                            <Button size="sm" variant="warning" onClick={() => resetPw.mutate(u.user_id)}>OK</Button>
                          </span>
                        )}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
