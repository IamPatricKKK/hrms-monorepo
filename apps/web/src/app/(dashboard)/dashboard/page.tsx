"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, PageTitle, EmptyState } from "@/components/ui/misc";
import type { DashboardStats } from "@hrms/shared";
import { formatDate } from "@/lib/utils";

const STATUS_BADGE: Record<string, "warning" | "success" | "destructive"> = {
  pending: "warning", approved: "success", rejected: "destructive",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối",
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiGet<DashboardStats>("/dashboard"),
  });

  if (isLoading || !data) {
    return <div className="text-sm text-muted-foreground">Đang tải...</div>;
  }

  const stats = [
    { label: "Nhân viên đang làm", value: data.total_employees },
    { label: "Phòng ban", value: data.total_departments },
    { label: "Đơn nghỉ chờ duyệt", value: data.pending_leaves },
    { label: "Chấm công hôm nay", value: data.attendance_today },
  ];
  const total = Math.max(1, data.total_employees);

  return (
    <>
      <PageTitle title="Dashboard" subtitle={`Hôm nay: ${formatDate(new Date())}`} />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 py-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-100 text-lg font-bold text-primary">
                {s.label.charAt(0)}
              </div>
              <div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Phân bố nhân sự theo phòng ban</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.dept_distribution.length === 0 ? (
              <EmptyState>Chưa có dữ liệu phòng ban.</EmptyState>
            ) : (
              data.dept_distribution.map((d) => (
                <div key={d.dept_name} className="flex items-center gap-3 text-sm">
                  <div className="min-w-[160px]">{d.dept_name}</div>
                  <div className="flex-1 overflow-hidden rounded bg-blue-100">
                    <div
                      className="h-2 bg-primary"
                      style={{ width: `${Math.round((d.count / total) * 100)}%` }}
                    />
                  </div>
                  <div className="min-w-[24px] text-right font-semibold">{d.count}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Đơn nghỉ phép gần nhất</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">Nhân viên</th>
                  <th className="px-4 py-2 text-left">Khoảng</th>
                  <th className="px-4 py-2 text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.recent_leaves.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-muted-foreground">
                      Chưa có đơn nghỉ nào.
                    </td>
                  </tr>
                ) : (
                  data.recent_leaves.map((l) => (
                    <tr key={l.leave_id}>
                      <td className="px-4 py-2">{l.employee?.full_name}</td>
                      <td className="px-4 py-2">
                        {formatDate(l.start_date)} → {formatDate(l.end_date)}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant={STATUS_BADGE[l.status] || "default"}>
                          {STATUS_LABEL[l.status] || l.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
