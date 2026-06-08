"use client";

import { EmployeeForm } from "@/components/employee-form";
import { PageTitle } from "@/components/ui/misc";

export default function NewEmployeePage() {
  return (
    <>
      <PageTitle
        title="Thêm nhân viên mới"
        subtitle="Các trường có dấu * là bắt buộc (UI-01)."
      />
      <EmployeeForm mode="create" />
    </>
  );
}
