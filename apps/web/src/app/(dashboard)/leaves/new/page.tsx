"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Alert, FieldError, Label, PageTitle } from "@/components/ui/misc";
import { getUser } from "@/lib/auth";
import type { EmployeeDto } from "@hrms/shared";

export default function NewLeavePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [leaveType, setLeaveType] = useState("Phép năm");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setUser(getUser()); }, []);

  const { data: emp } = useQuery({
    queryKey: ["my-emp", user?.employee_id],
    queryFn: () => apiGet<EmployeeDto>(`/employees/${user.employee_id}`),
    enabled: !!user?.employee_id,
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!startDate) errs.startDate = "Vui lòng chọn ngày bắt đầu";
    if (!endDate) errs.endDate = "Vui lòng chọn ngày kết thúc";
    if (!reason.trim()) errs.reason = "Vui lòng nhập lý do nghỉ";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setGeneralError(null);
    try {
      await apiPost("/leaves", {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });
      toast.success("Đã gửi đơn nghỉ phép. HR sẽ phê duyệt sớm.");
      router.push("/leaves");
    } catch (err: any) {
      setGeneralError(err instanceof ApiError ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageTitle
        title="Gửi đơn nghỉ phép (FR-05)"
        subtitle={emp ? `Bạn còn ${emp.leaves_remaining} / 12 ngày phép trong năm (BR-04).` : ""}
      />

      {generalError && <Alert variant="danger" className="mb-4">{generalError}</Alert>}

      <Card className="max-w-2xl">
        <CardContent>
          <form onSubmit={onSubmit} noValidate>
            <div className="mb-3">
              <Label>Loại nghỉ</Label>
              <Select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                <option>Phép năm</option>
                <option>Nghỉ ốm</option>
                <option>Việc gia đình</option>
                <option>Nghỉ không lương</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>Ngày bắt đầu</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} invalid={!!errors.startDate} required />
                <FieldError>{errors.startDate}</FieldError>
              </div>
              <div>
                <Label required>Ngày kết thúc</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} invalid={!!errors.endDate} required />
                <FieldError>{errors.endDate}</FieldError>
              </div>
            </div>
            <div className="mt-3">
              <Label required>Lý do</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} invalid={!!errors.reason} rows={3} required />
              <FieldError>{errors.reason}</FieldError>
            </div>

            <Alert variant="info" className="mt-4 text-xs">
              <strong>Quy tắc:</strong> ngày kết thúc ≥ ngày bắt đầu, ngày bắt đầu ≥ hôm nay (BR-06);
              không trùng đơn đã gửi; số ngày ≤ số phép còn lại (BR-04).
            </Alert>

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push("/leaves")}>Hủy</Button>
              <Button type="submit" disabled={loading}>{loading ? "Đang gửi..." : "Gửi đơn"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
