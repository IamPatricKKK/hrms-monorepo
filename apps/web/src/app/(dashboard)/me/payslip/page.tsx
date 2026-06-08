"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState, PageTitle } from "@/components/ui/misc";
import { formatMoney } from "@/lib/utils";
import type { PayrollDto } from "@hrms/shared";

export default function MyPayslipPage() {
  const { data: items = [] } = useQuery({
    queryKey: ["my-payslip"],
    queryFn: () => apiGet<PayrollDto[]>("/payroll/me"),
  });

  return (
    <>
      <PageTitle title="Bảng lương của tôi" subtitle="Lịch sử bảng lương cá nhân." />

      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Kỳ</TH>
                <TH className="text-right">Ngày công</TH>
                <TH className="text-right">Lương CB</TH>
                <TH className="text-right">Phụ cấp</TH>
                <TH className="text-right">Tạm ứng</TH>
                <TH className="text-right">Thực nhận</TH>
              </TR>
            </THead>
            <TBody>
              {items.length === 0 ? (
                <TR><TD colSpan={6}><EmptyState>Chưa có bảng lương.</EmptyState></TD></TR>
              ) : items.map((p) => (
                <TR key={p.pay_id}>
                  <TD>{String(p.month).padStart(2, "0")}/{p.year}</TD>
                  <TD className="text-right">{p.work_days}</TD>
                  <TD className="text-right">{formatMoney(p.base_salary)}</TD>
                  <TD className="text-right">{formatMoney(p.allowance)}</TD>
                  <TD className="text-right">{formatMoney(p.advance)}</TD>
                  <TD className="text-right font-bold text-emerald-700">{formatMoney(p.net_salary)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
