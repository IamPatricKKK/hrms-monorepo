"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { EmployeeForm } from "@/components/employee-form";
import { PageTitle } from "@/components/ui/misc";
import type { EmployeeDto } from "@hrms/shared";

export default function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const { data: emp } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => apiGet<EmployeeDto>(`/employees/${id}`),
  });
  if (!emp) return <p className="text-sm text-muted-foreground">Đang tải...</p>;
  return (
    <>
      <PageTitle title={`Sửa hồ sơ ${emp.full_name}`} subtitle="Các trường có dấu * là bắt buộc." />
      <EmployeeForm mode="edit" initialEmployee={emp} />
    </>
  );
}
