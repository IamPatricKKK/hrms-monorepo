"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, apiDelete, apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label, PageTitle } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

interface CategoryPageProps {
  title: string;
  subtitle: string;
  resourcePath: string;        // "/departments" | "/positions"
  nameField: string;           // "dept_name" | "position_name"
  idField: string;             // "dept_id" | "position_id"
}

export function CategoryPage({ title, subtitle, resourcePath, nameField, idField }: CategoryPageProps) {
  const qc = useQueryClient();
  const [name, setName] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: [resourcePath],
    queryFn: () => apiGet<any[]>(resourcePath),
  });

  const create = useMutation({
    mutationFn: () => apiPost(resourcePath, { [nameField]: name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [resourcePath] });
      toast.success(`Đã thêm "${name}"`); setName("");
    },
    onError: (e: any) => toast.error(e instanceof ApiError ? e.message : "Lỗi"),
  });
  const del = useMutation({
    mutationFn: (id: number) => apiDelete(`${resourcePath}/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [resourcePath] });
      toast.success("Đã xóa");
    },
    onError: (e: any) => toast.error(e instanceof ApiError ? e.message : "Lỗi"),
  });

  function onCreate(e: FormEvent) { e.preventDefault(); if (name.trim()) create.mutate(); }

  return (
    <>
      <PageTitle title={title} subtitle={subtitle} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[400px_1fr]">
        <Card>
          <CardHeader><CardTitle>Thêm mới</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onCreate}>
              <div className="mb-3">
                <Label required>Tên</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={create.isPending}>
                {create.isPending ? "Đang lưu..." : "Thêm"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Danh sách ({items.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR><TH>ID</TH><TH>Tên</TH><TH className="text-right">Số NV</TH><TH /></TR>
              </THead>
              <TBody>
                {items.map((it) => (
                  <TR key={it[idField]}>
                    <TD>{it[idField]}</TD>
                    <TD>{it[nameField]}</TD>
                    <TD className="text-right">{it.employee_count ?? 0}</TD>
                    <TD className="text-right">
                      <Button size="sm" variant="destructive" onClick={() => {
                        if (confirm(`Xóa "${it[nameField]}"?`)) del.mutate(it[idField]);
                      }}>Xóa</Button>
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
