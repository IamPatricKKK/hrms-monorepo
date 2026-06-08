"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Alert, Label, PageTitle } from "@/components/ui/misc";
import { formatMoney } from "@/lib/utils";
import type { EmployeeDto } from "@hrms/shared";

export default function CalculatePayrollPage() {
  const router = useRouter();
  const today = new Date();
  const [empId, setEmpId] = useState(0);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [allowance, setAllowance] = useState(0);
  const [advance, setAdvance] = useState(0);
  const [confirm, setConfirm] = useState<{ existing: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-all"],
    queryFn: () => apiGet<{ items: EmployeeDto[] }>("/employees?page=1&page_size=100").then(r => r.items),
  });

  async function submit(e: FormEvent, overwrite = false) {
    e.preventDefault();
    if (!empId) { toast.error("Vui lòng chọn nhân viên"); return; }
    setLoading(true);
    try {
      const result = await apiPost("/payroll/calculate", {
        emp_id: empId, month, year, allowance, advance,
        confirm_overwrite: overwrite,
      });
      toast.success(`Đã tính lương: ${formatMoney(result.net_salary)}`);
      setConfirm(null);
      router.push(`/payroll?month=${month}&year=${year}`);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        setConfirm({ existing: err.payload?.existing_net_salary });
      } else {
        toast.error(err instanceof ApiError ? err.message : "Lỗi");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageTitle title="Tính lương tháng (FR-04)"
        subtitle="Công thức: Lương = (LCB / 26) × NC + PC − TƯ (≥ 0). Ngày công hợp lệ: 0 ≤ NC ≤ 26 (BR-07)." />

      <Card className="max-w-2xl">
        <CardContent>
          <form onSubmit={(e) => submit(e, false)}>
            <div className="mb-3">
              <Label required>Nhân viên</Label>
              <Select value={empId} onChange={(e) => setEmpId(Number(e.target.value))} required>
                <option value={0}>— Chọn nhân viên —</option>
                {employees.map((e) => (
                  <option key={e.emp_id} value={e.emp_id}>
                    {e.emp_code} · {e.full_name} · LCB {formatMoney(e.base_salary)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>Tháng</Label>
                <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label required>Năm</Label>
                <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                  {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                </Select>
              </div>
              <div>
                <Label>Phụ cấp (VND)</Label>
                <Input type="number" min={0} step={1000} value={allowance} onChange={(e) => setAllowance(Number(e.target.value))} />
              </div>
              <div>
                <Label>Tạm ứng (VND)</Label>
                <Input type="number" min={0} step={1000} value={advance} onChange={(e) => setAdvance(Number(e.target.value))} />
              </div>
            </div>

            <Alert variant="info" className="mt-4">
              Hệ thống sẽ tự lấy ngày công đã chấm trong tháng. Nếu đã có bảng lương kỳ này, hệ thống sẽ hỏi xác nhận tính lại.
            </Alert>

            {confirm && (
              <Alert variant="warning" className="mt-3">
                <p>Đã tồn tại bảng lương cho kỳ này (lương trước đó: <strong>{formatMoney(confirm.existing)}</strong>).</p>
                <div className="mt-2 flex gap-2">
                  <Button type="button" variant="warning" onClick={(e) => submit(e as any, true)} disabled={loading}>
                    {loading ? "Đang xử lý..." : "Tính lại (ghi đè)"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setConfirm(null)}>Hủy</Button>
                </div>
              </Alert>
            )}

            {!confirm && (
              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.push("/payroll")}>Hủy</Button>
                <Button type="submit" variant="success" disabled={loading}>
                  {loading ? "Đang xử lý..." : "Tính lương"}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </>
  );
}
