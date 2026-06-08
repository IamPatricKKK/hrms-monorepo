"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, PageTitle } from "@/components/ui/misc";
import { formatDate, formatMoney } from "@/lib/utils";
import type { EmployeeDto, AttendanceDto, PayrollDto, LeaveDto } from "@hrms/shared";

const LEAVE_BADGE: Record<string, "warning" | "success" | "destructive"> = {
  pending: "warning", approved: "success", rejected: "destructive",
};
const LEAVE_LABEL: Record<string, string> = {
  pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối",
};

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const empId = Number(id);

  const { data: emp } = useQuery({
    queryKey: ["employee", empId],
    queryFn: () => apiGet<EmployeeDto>(`/employees/${empId}`),
  });
  const { data: attendance = [] } = useQuery({
    queryKey: ["attendance-of", empId],
    queryFn: () => apiGet<AttendanceDto[]>(`/attendance?emp_id=${empId}`),
    enabled: !!empId,
  });
  const { data: payroll = [] } = useQuery({
    queryKey: ["payroll-of", empId],
    queryFn: () => apiGet<PayrollDto[]>(`/payroll?emp_id=${empId}`),
    enabled: !!empId,
  });

  if (!emp) return <p className="text-sm text-muted-foreground">Đang tải...</p>;

  return (
    <>
      <PageTitle title={emp.full_name} subtitle={`${emp.emp_code} · ${emp.position?.position_name} · ${emp.department?.dept_name}`}>
        <Link href={`/employees/${emp.emp_id}/edit`}>
          <Button variant="outline">Sửa hồ sơ</Button>
        </Link>
      </PageTitle>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Thông tin cá nhân</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-[140px_1fr] gap-2 text-sm">
            <span className="text-muted-foreground">Mã NV</span><span>{emp.emp_code}</span>
            <span className="text-muted-foreground">Họ tên</span><span>{emp.full_name}</span>
            <span className="text-muted-foreground">Ngày sinh</span><span>{formatDate(emp.dob)}</span>
            <span className="text-muted-foreground">Giới tính</span><span>{emp.gender}</span>
            <span className="text-muted-foreground">Email</span><span>{emp.email}</span>
            <span className="text-muted-foreground">SĐT</span><span>{emp.phone}</span>
            <span className="text-muted-foreground">Trạng thái</span>
            <span>{emp.status === "active" ? <Badge variant="success">Đang làm</Badge> : <Badge variant="secondary">Nghỉ việc</Badge>}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Công việc &amp; lương</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-[140px_1fr] gap-2 text-sm">
            <span className="text-muted-foreground">Phòng ban</span><span>{emp.department?.dept_name || "-"}</span>
            <span className="text-muted-foreground">Chức vụ</span><span>{emp.position?.position_name || "-"}</span>
            <span className="text-muted-foreground">Ngày vào làm</span><span>{formatDate(emp.join_date)}</span>
            <span className="text-muted-foreground">Lương cơ bản</span><span className="font-semibold">{formatMoney(emp.base_salary)}</span>
            <span className="text-muted-foreground">Lương/ngày</span><span>{formatMoney(emp.base_salary / 26)}</span>
            <span className="text-muted-foreground">Phép còn lại</span><span>{emp.leaves_remaining} / 12 ngày</span>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Chấm công gần nhất</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-2 text-left">Ngày</th><th className="px-4 py-2 text-left">Vào</th><th className="px-4 py-2 text-left">Ra</th><th className="px-4 py-2 text-right">Giờ làm</th></tr>
              </thead>
              <tbody className="divide-y">
                {attendance.slice(0, 10).map((a) => (
                  <tr key={a.att_id}>
                    <td className="px-4 py-2">{formatDate(a.work_date)}</td>
                    <td className="px-4 py-2">{a.check_in?.slice(0, 5)}</td>
                    <td className="px-4 py-2">{a.check_out?.slice(0, 5)}</td>
                    <td className="px-4 py-2 text-right">{a.work_hours?.toFixed(1)} h</td>
                  </tr>
                ))}
                {attendance.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Chưa có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Bảng lương</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-2 text-left">Kỳ</th><th className="px-4 py-2 text-right">NC</th><th className="px-4 py-2 text-right">Thực nhận</th></tr>
              </thead>
              <tbody className="divide-y">
                {payroll.slice(0, 5).map((p) => (
                  <tr key={p.pay_id}>
                    <td className="px-4 py-2">{String(p.month).padStart(2, "0")}/{p.year}</td>
                    <td className="px-4 py-2 text-right">{p.work_days}</td>
                    <td className="px-4 py-2 text-right font-semibold text-emerald-700">{formatMoney(p.net_salary)}</td>
                  </tr>
                ))}
                {payroll.length === 0 && (
                  <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">Chưa có bảng lương</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
