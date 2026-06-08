"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Badge, EmptyState, PageTitle } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";
import type { LeaveDto } from "@hrms/shared";

export default function ApproveLeavesPage() {
  const qc = useQueryClient();
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["leaves-pending"],
    queryFn: () => apiGet<LeaveDto[]>("/leaves/pending"),
  });

  const approve = useMutation({
    mutationFn: (id: number) => apiPost(`/leaves/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaves-pending"] });
      toast.success("Đã duyệt đơn");
    },
    onError: (e: any) => toast.error(e instanceof ApiError ? e.message : "Lỗi"),
  });
  const reject = useMutation({
    mutationFn: (id: number) => apiPost(`/leaves/${id}/reject`, { rejection_reason: rejectReason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaves-pending"] });
      toast.success("Đã từ chối đơn");
      setRejecting(null); setRejectReason("");
    },
    onError: (e: any) => toast.error(e instanceof ApiError ? e.message : "Lỗi"),
  });

  return (
    <>
      <PageTitle title="Phê duyệt đơn nghỉ phép (FR-06)" subtitle={`Còn ${items.length} đơn ở trạng thái Chờ duyệt.`} />

      {items.length === 0 ? (
        <Card><CardContent><EmptyState>Không có đơn nghỉ nào đang chờ duyệt.</EmptyState></CardContent></Card>
      ) : items.map((l) => (
        <Card key={l.leave_id} className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {l.employee?.emp_code} · {l.employee?.full_name}
                <Badge variant="warning" className="ml-2">Chờ duyệt</Badge>
              </CardTitle>
              <span className="text-xs text-muted-foreground">Gửi {formatDate(l.created_at)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Loại nghỉ</span><span>{l.leave_type}</span>
              <span className="text-muted-foreground">Khoảng ngày</span>
              <span>{formatDate(l.start_date)} → {formatDate(l.end_date)} <strong>({l.days_count} ngày)</strong></span>
              <span className="text-muted-foreground">Phép còn lại</span>
              <span>{l.employee?.leaves_remaining} / 12 ngày</span>
              <span className="text-muted-foreground">Lý do</span><span>{l.reason}</span>
            </div>

            <div className="mt-4 flex items-start gap-2">
              <Button
                variant="success"
                onClick={() => { if (confirm(`Duyệt đơn nghỉ ${l.days_count} ngày?`)) approve.mutate(l.leave_id); }}
                disabled={approve.isPending}
              >
                ✓ Duyệt
              </Button>

              {rejecting !== l.leave_id ? (
                <Button variant="destructive" onClick={() => setRejecting(l.leave_id)}>✕ Từ chối</Button>
              ) : (
                <div className="flex-1">
                  <Textarea
                    rows={2} value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Nhập lý do từ chối (bắt buộc - A1 trong FR-06)"
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="destructive" size="sm"
                      disabled={!rejectReason.trim() || reject.isPending}
                      onClick={() => reject.mutate(l.leave_id)}
                    >Xác nhận từ chối</Button>
                    <Button variant="outline" size="sm" onClick={() => { setRejecting(null); setRejectReason(""); }}>Hủy</Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
