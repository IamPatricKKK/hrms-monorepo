"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPatch, apiPost, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Label, FieldError, HelpText } from "@/components/ui/misc";
import type {
  DepartmentDto, EmployeeDto, PositionDto,
} from "@hrms/shared";
import { EMAIL_REGEX, PHONE_REGEX } from "@hrms/shared";
import { dateToInput } from "@/lib/utils";

interface EmployeeFormProps {
  mode: "create" | "edit";
  initialEmployee?: EmployeeDto;
}

export function EmployeeForm({ mode, initialEmployee }: EmployeeFormProps) {
  const router = useRouter();
  const [values, setValues] = useState({
    full_name: initialEmployee?.full_name || "",
    dob: dateToInput(initialEmployee?.dob),
    gender: initialEmployee?.gender || "Nam",
    email: initialEmployee?.email || "",
    phone: initialEmployee?.phone || "",
    dept_id: initialEmployee?.dept_id || 0,
    position_id: initialEmployee?.position_id || 0,
    base_salary: initialEmployee?.base_salary || 0,
    join_date: dateToInput(initialEmployee?.join_date),
    leaves_remaining: initialEmployee?.leaves_remaining ?? 12,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiGet<DepartmentDto[]>("/departments"),
  });
  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: () => apiGet<PositionDto[]>("/positions"),
  });

  function setVal<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((s) => ({ ...s, [k]: v }));
    setErrors((s) => { const c = { ...s }; delete c[k as string]; return c; });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!values.full_name.trim()) e.full_name = "Họ tên là bắt buộc";
    if (!values.email.trim()) e.email = "Email là bắt buộc";
    else if (!EMAIL_REGEX.test(values.email)) e.email = "Email sai định dạng";
    if (!values.phone.trim()) e.phone = "Số điện thoại là bắt buộc";
    else if (!PHONE_REGEX.test(values.phone)) {
      e.phone = /[A-Za-z]/.test(values.phone)
        ? "Số điện thoại chỉ gồm chữ số"
        : "Số điện thoại phải gồm đúng 10 chữ số";
    }
    if (!values.dept_id) e.dept_id = "Vui lòng chọn phòng ban";
    if (!values.position_id) e.position_id = "Vui lòng chọn chức vụ";
    if (!values.base_salary || values.base_salary <= 0)
      e.base_salary = "Lương cơ bản phải là số dương";
    if (!values.join_date) e.join_date = "Ngày vào làm là bắt buộc";
    else if (new Date(values.join_date) > new Date())
      e.join_date = "Ngày vào làm không được lớn hơn ngày hiện tại";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const body = {
        ...values,
        base_salary: Number(values.base_salary),
        dept_id: Number(values.dept_id),
        position_id: Number(values.position_id),
        leaves_remaining: Number(values.leaves_remaining),
        dob: values.dob || undefined,
      };
      if (mode === "create") {
        const emp = await apiPost<EmployeeDto>("/employees", body);
        toast.success(`Đã thêm nhân viên ${emp.full_name} (${emp.emp_code})`);
        router.push(`/employees/${emp.emp_id}`);
      } else if (initialEmployee) {
        const emp = await apiPatch<EmployeeDto>(`/employees/${initialEmployee.emp_id}`, body);
        toast.success(`Đã cập nhật ${emp.full_name}`);
        router.push(`/employees/${emp.emp_id}`);
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err instanceof ApiError ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} noValidate>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mode === "edit" && (
              <div>
                <Label>Mã nhân viên</Label>
                <Input value={initialEmployee?.emp_code || ""} readOnly disabled />
              </div>
            )}
            {mode === "edit" && <div />}

            <div>
              <Label required>Họ và tên</Label>
              <Input
                value={values.full_name}
                onChange={(e) => setVal("full_name", e.target.value)}
                invalid={!!errors.full_name}
                required
              />
              <FieldError>{errors.full_name}</FieldError>
            </div>

            <div>
              <Label>Ngày sinh</Label>
              <Input type="date" value={values.dob} onChange={(e) => setVal("dob", e.target.value)} />
            </div>

            <div>
              <Label>Giới tính</Label>
              <Select value={values.gender} onChange={(e) => setVal("gender", e.target.value)}>
                <option>Nam</option><option>Nữ</option><option>Khác</option>
              </Select>
            </div>

            <div>
              <Label required>Email</Label>
              <Input
                type="email"
                value={values.email}
                onChange={(e) => setVal("email", e.target.value)}
                invalid={!!errors.email}
                required
              />
              <FieldError>{errors.email}</FieldError>
              <HelpText>Định dạng user@domain.tld (BR-01)</HelpText>
            </div>

            <div>
              <Label required>Số điện thoại</Label>
              <Input
                maxLength={10}
                value={values.phone}
                onChange={(e) => setVal("phone", e.target.value)}
                invalid={!!errors.phone}
                required
              />
              <FieldError>{errors.phone}</FieldError>
              <HelpText>Đúng 10 chữ số</HelpText>
            </div>

            <div>
              <Label required>Phòng ban</Label>
              <Select
                value={values.dept_id}
                onChange={(e) => setVal("dept_id", Number(e.target.value))}
                invalid={!!errors.dept_id}
              >
                <option value={0}>— Chọn phòng ban —</option>
                {departments.map((d) => (
                  <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>
                ))}
              </Select>
              <FieldError>{errors.dept_id}</FieldError>
            </div>

            <div>
              <Label required>Chức vụ</Label>
              <Select
                value={values.position_id}
                onChange={(e) => setVal("position_id", Number(e.target.value))}
                invalid={!!errors.position_id}
              >
                <option value={0}>— Chọn chức vụ —</option>
                {positions.map((p) => (
                  <option key={p.position_id} value={p.position_id}>{p.position_name}</option>
                ))}
              </Select>
              <FieldError>{errors.position_id}</FieldError>
            </div>

            <div>
              <Label required>Lương cơ bản (VND)</Label>
              <Input
                type="number" min={0} step={1000}
                value={values.base_salary}
                onChange={(e) => setVal("base_salary", Number(e.target.value))}
                invalid={!!errors.base_salary}
                required
              />
              <FieldError>{errors.base_salary}</FieldError>
              <HelpText>Số dương (BR-03)</HelpText>
            </div>

            <div>
              <Label required>Ngày vào làm</Label>
              <Input
                type="date"
                value={values.join_date}
                onChange={(e) => setVal("join_date", e.target.value)}
                invalid={!!errors.join_date}
                required
              />
              <FieldError>{errors.join_date}</FieldError>
              <HelpText>Không lớn hơn ngày hiện tại</HelpText>
            </div>

            <div>
              <Label>Số phép còn lại</Label>
              <Input
                type="number" min={0} max={12}
                value={values.leaves_remaining}
                onChange={(e) => setVal("leaves_remaining", Number(e.target.value))}
              />
              <HelpText>Tối đa 12 ngày/năm (BR-04)</HelpText>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Hủy</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : mode === "create" ? "Lưu hồ sơ" : "Cập nhật"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
