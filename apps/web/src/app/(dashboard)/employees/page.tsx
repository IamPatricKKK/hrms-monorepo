"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDelete, apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge, EmptyState, PageTitle } from "@/components/ui/misc";
import { formatMoney } from "@/lib/utils";
import type { DepartmentDto, EmployeeDto } from "@hrms/shared";

interface ListResult { items: EmployeeDto[]; total: number; page: number; page_size: number; }

export default function EmployeesPage() {
  const [q, setQ] = useState("");
  const [deptId, setDeptId] = useState(0);
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiGet<DepartmentDto[]>("/departments"),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["employees", { q, deptId, page }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (deptId) params.set("dept_id", String(deptId));
      params.set("page", String(page));
      return apiGet<ListResult>(`/employees?${params}`);
    },
  });

  const delMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/employees/${id}`),
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success(r.soft_deleted ? "Đã đánh dấu nghỉ việc (BR-02)" : "Đã xóa nhân viên");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <>
      <PageTitle title="Hồ sơ nhân viên" subtitle={`Quản lý hồ sơ nhân viên (FR-02) - tổng ${data?.total ?? 0} bản ghi.`}>
        <Link href="/employees/new"><Button variant="success">+ Thêm nhân viên</Button></Link>
      </PageTitle>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Tìm theo tên, mã, email..."
              className="max-w-[280px]"
              value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
            <Select
              className="max-w-[240px]"
              value={deptId}
              onChange={(e) => { setDeptId(Number(e.target.value)); setPage(1); }}
            >
              <option value={0}>— Tất cả phòng ban —</option>
              {departments.map((d) => (
                <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>
              ))}
            </Select>
          </div>

          <Table>
            <THead>
              <TR>
                <TH>Mã NV</TH>
                <TH>Họ tên</TH>
                <TH>Email</TH>
                <TH>SĐT</TH>
                <TH>Phòng ban</TH>
                <TH>Chức vụ</TH>
                <TH className="text-right">Lương CB</TH>
                <TH>Trạng thái</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {isLoading ? (
                <TR><TD colSpan={9}><EmptyState>Đang tải...</EmptyState></TD></TR>
              ) : data?.items.length === 0 ? (
                <TR><TD colSpan={9}><EmptyState>Không có dữ liệu</EmptyState></TD></TR>
              ) : (
                data?.items.map((e) => (
                  <TR key={e.emp_id}>
                    <TD className="font-mono"><Link href={`/employees/${e.emp_id}`} className="text-primary hover:underline">{e.emp_code}</Link></TD>
                    <TD>{e.full_name}</TD>
                    <TD>{e.email}</TD>
                    <TD>{e.phone}</TD>
                    <TD>{e.department?.dept_name || "-"}</TD>
                    <TD>{e.position?.position_name || "-"}</TD>
                    <TD className="text-right">{formatMoney(e.base_salary)}</TD>
                    <TD>
                      {e.status === "active"
                        ? <Badge variant="success">Đang làm</Badge>
                        : <Badge variant="secondary">Nghỉ việc</Badge>}
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Link href={`/employees/${e.emp_id}`}><Button size="sm" variant="outline">Xem</Button></Link>
                        <Link href={`/employees/${e.emp_id}/edit`}><Button size="sm" variant="outline">Sửa</Button></Link>
                        <Button
                          size="sm" variant="destructive"
                          onClick={() => { if (confirm(`Xóa ${e.full_name}?`)) delMutation.mutate(e.emp_id); }}
                        >Xóa</Button>
                      </div>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 text-sm">
              <span className="text-muted-foreground">Trang {page}/{totalPages}</span>
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Trước</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sau ›</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
