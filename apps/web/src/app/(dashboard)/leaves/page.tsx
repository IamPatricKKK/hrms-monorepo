"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge, EmptyState, PageTitle } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";
import { getUser } from "@/lib/auth";
import type { LeaveDto } from "@hrms/shared";

const BADGE: Record<string, "warning" | "success" | "destructive"> = {
  pending: "warning", approved: "success", rejected: "destructive",
};
const LABEL: Record<string, string> = {
  pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối",
};

export default function LeavesPage() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => { setUser(getUser()); }, []);

  const { data: items = [] } = useQuery({
    queryKey: ["leaves", user?.role],
    queryFn: () => apiGet<LeaveDto[]>("/leaves"),
    enabled: !!user,
  });

  const isMine = user?.role === "EMPLOYEE";

  return (
    <>
      <PageTitle
        title={isMine ? "Đơn nghỉ phép của tôi" : "Tất cả đơn nghỉ phép"}
        subtitle={isMine ? "Theo dõi trạng thái các đơn nghỉ đã gửi." : `Tổng số ${items.length} đơn.`}
      >
        {isMine
          ? <Link href="/leaves/new"><Button variant="success">+ Gửi đơn nghỉ mới</Button></Link>
          : <Link href="/leaves/approve"><Button>→ Trang phê duyệt</Button></Link>}
      </PageTitle>

      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                {!isMine && <TH>Nhân viên</TH>}
                <TH>Loại</TH><TH>Khoảng ngày</TH><TH className="text-right">Ngày</TH>
                <TH>Lý do</TH><TH>Trạng thái</TH><TH>Người duyệt</TH>
              </TR>
            </THead>
            <TBody>
              {items.length === 0 ? (
                <TR><TD colSpan={isMine ? 6 : 7}><EmptyState>Chưa có đơn nghỉ phép.</EmptyState></TD></TR>
              ) : items.map((l) => (
                <TR key={l.leave_id}>
                  {!isMine && <TD>{l.employee?.emp_code} · {l.employee?.full_name}</TD>}
                  <TD>{l.leave_type}</TD>
                  <TD>{formatDate(l.start_date)} → {formatDate(l.end_date)}</TD>
                  <TD className="text-right">{l.days_count}</TD>
                  <TD className="max-w-[260px]">
                    {l.reason}
                    {l.rejection_reason && (
                      <div className="mt-1 text-xs text-muted-foreground">Lý do từ chối: {l.rejection_reason}</div>
                    )}
                  </TD>
                  <TD><Badge variant={BADGE[l.status]}>{LABEL[l.status]}</Badge></TD>
                  <TD>{(l as any).approver?.username || "-"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
