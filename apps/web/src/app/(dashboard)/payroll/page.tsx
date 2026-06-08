"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState, PageTitle } from "@/components/ui/misc";
import { formatMoney } from "@/lib/utils";
import type { PayrollDto } from "@hrms/shared";

export default function PayrollPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const { data: items = [] } = useQuery({
    queryKey: ["payroll", month, year],
    queryFn: () => apiGet<PayrollDto[]>(`/payroll?month=${month}&year=${year}`),
  });

  return (
    <>
      <PageTitle title="Bảng lương (FR-04)" subtitle={`Kết quả tính lương đã lưu - tháng ${String(month).padStart(2, "0")}/${year}.`}>
        <Link href="/payroll/calculate"><Button variant="success">+ Tính lương mới</Button></Link>
      </PageTitle>

      <Card>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tháng/năm:</span>
            <Select className="max-w-[100px]" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
              ))}
            </Select>
            <Select className="max-w-[120px]" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>

          <Table>
            <THead>
              <TR>
                <TH>Mã NV</TH><TH>Họ tên</TH>
                <TH className="text-right">Lương CB</TH>
                <TH className="text-right">NC</TH>
                <TH className="text-right">Phụ cấp</TH>
                <TH className="text-right">Tạm ứng</TH>
                <TH className="text-right">Thực nhận</TH>
              </TR>
            </THead>
            <TBody>
              {items.length === 0 ? (
                <TR><TD colSpan={7}><EmptyState>Chưa có bảng lương tháng này. Hãy bấm "+ Tính lương mới".</EmptyState></TD></TR>
              ) : items.map((p) => (
                <TR key={p.pay_id}>
                  <TD className="font-mono">{p.employee?.emp_code}</TD>
                  <TD>{p.employee?.full_name}</TD>
                  <TD className="text-right">{formatMoney(p.base_salary)}</TD>
                  <TD className="text-right">{p.work_days}</TD>
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
