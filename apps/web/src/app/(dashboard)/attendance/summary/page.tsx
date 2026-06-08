"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Badge, PageTitle } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatMoney } from "@/lib/utils";
import type { EmployeeDto } from "@hrms/shared";
import Link from "next/link";

type Row = { employee: EmployeeDto; work_days: number };

export default function SummaryPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const { data: rows = [] } = useQuery({
    queryKey: ["att-summary", month, year],
    queryFn: () => apiGet<Row[]>(`/attendance/summary/month?month=${month}&year=${year}`),
  });

  return (
    <>
      <PageTitle title="Tổng hợp công tháng (FR-03)" subtitle="Tổng số ngày công của các nhân viên trong tháng được chọn." />
      <Card>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Tháng/năm:</span>
            <Select className="max-w-[100px]" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
              ))}
            </Select>
            <Select className="max-w-[120px]" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
            <div className="flex-1" />
            <Link href="/payroll/calculate"><Button variant="outline">→ Tính lương</Button></Link>
          </div>

          <Table>
            <THead>
              <TR>
                <TH>Mã NV</TH><TH>Họ tên</TH><TH>Phòng ban</TH>
                <TH className="text-right">Lương CB</TH><TH className="text-right">Ngày công</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.employee.emp_id}>
                  <TD className="font-mono">{r.employee.emp_code}</TD>
                  <TD>{r.employee.full_name}</TD>
                  <TD>{r.employee.department?.dept_name || "-"}</TD>
                  <TD className="text-right">{formatMoney(r.employee.base_salary)}</TD>
                  <TD className="text-right">
                    <Badge variant={r.work_days >= 22 ? "success" : r.work_days >= 1 ? "primary" : "secondary"}>
                      {r.work_days} ngày
                    </Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
