"use client";

import { useState, FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPost, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Label, PageTitle } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { todayIso, formatTime } from "@/lib/utils";
import type { AttendanceDto, EmployeeDto } from "@hrms/shared";

export default function AttendancePage() {
  const qc = useQueryClient();
  const [date, setDate] = useState(todayIso());
  const [emp, setEmp] = useState(0);
  const [checkIn, setCheckIn] = useState("08:00");
  const [checkOut, setCheckOut] = useState("17:00");

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-all"],
    queryFn: () => apiGet<{ items: EmployeeDto[] }>("/employees?page=1&page_size=100").then(r => r.items),
  });
  const { data: items = [] } = useQuery({
    queryKey: ["attendance", date],
    queryFn: () => apiGet<AttendanceDto[]>(`/attendance?work_date=${date}`),
  });

  const create = useMutation({
    mutationFn: () => apiPost("/attendance", {
      emp_id: emp, work_date: date, check_in: checkIn + ":00", check_out: checkOut + ":00",
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Đã chấm công thành công");
    },
    onError: (e: any) => toast.error(e instanceof ApiError ? e.message : "Lỗi"),
  });
  const del = useMutation({
    mutationFn: (id: number) => apiDelete(`/attendance/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Đã xóa");
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!emp) { toast.error("Chọn nhân viên"); return; }
    create.mutate();
  }

  return (
    <>
      <PageTitle title="Chấm công (FR-03)" subtitle="Ghi nhận chấm công hằng ngày của nhân viên." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader><CardTitle>Chấm công mới</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onSubmit}>
              <div className="mb-3">
                <Label required>Nhân viên</Label>
                <Select value={emp} onChange={(e) => setEmp(Number(e.target.value))}>
                  <option value={0}>— Chọn nhân viên —</option>
                  {employees.map((e) => (
                    <option key={e.emp_id} value={e.emp_id}>{e.emp_code} · {e.full_name}</option>
                  ))}
                </Select>
              </div>
              <div className="mb-3">
                <Label required>Ngày</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Giờ vào</Label>
                  <Input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                </div>
                <div>
                  <Label>Giờ ra</Label>
                  <Input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                </div>
              </div>
              <Button type="submit" className="mt-4 w-full" disabled={create.isPending}>
                {create.isPending ? "Đang lưu..." : "Lưu chấm công"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Chấm công ngày {date} ({items.length} bản ghi)</CardTitle>
              <Input type="date" className="max-w-[160px]" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>Mã NV</TH><TH>Họ tên</TH><TH>Vào</TH><TH>Ra</TH>
                  <TH className="text-right">Giờ làm</TH><TH />
                </TR>
              </THead>
              <TBody>
                {items.length === 0 ? (
                  <TR><TD colSpan={6} className="py-8 text-center text-muted-foreground">Chưa có chấm công</TD></TR>
                ) : items.map((a) => (
                  <TR key={a.att_id}>
                    <TD className="font-mono">{a.employee?.emp_code}</TD>
                    <TD>{a.employee?.full_name}</TD>
                    <TD>{formatTime(a.check_in)}</TD>
                    <TD>{formatTime(a.check_out)}</TD>
                    <TD className="text-right">{a.work_hours?.toFixed(1)} h</TD>
                    <TD className="text-right">
                      <Button size="sm" variant="destructive" onClick={() => del.mutate(a.att_id)}>Xóa</Button>
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
