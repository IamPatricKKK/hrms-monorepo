"use client";

import { CategoryPage } from "@/components/category-page";

export default function PositionsPage() {
  return (
    <CategoryPage
      title="Quản lý chức vụ"
      subtitle="Danh mục chức vụ trong tổ chức."
      resourcePath="/positions"
      nameField="position_name"
      idField="position_id"
    />
  );
}
