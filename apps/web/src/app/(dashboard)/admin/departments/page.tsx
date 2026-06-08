"use client";

import { CategoryPage } from "@/components/category-page";

export default function DepartmentsPage() {
  return (
    <CategoryPage
      title="Quản lý phòng ban"
      subtitle="Danh mục phòng ban dùng cho hồ sơ nhân viên."
      resourcePath="/departments"
      nameField="dept_name"
      idField="dept_id"
    />
  );
}
