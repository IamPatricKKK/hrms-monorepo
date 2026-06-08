/**
 * Seed CLI.  Chạy bằng:
 *   pnpm --filter @hrms/api seed
 *
 * - Drop tất cả bảng → tạo lại schema (nhờ synchronize: true của TypeORM)
 * - Insert tài khoản & dữ liệu mẫu khớp với báo cáo kiểm thử
 */
import "reflect-metadata";
import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";

import { ALL_ENTITIES } from "../data-source";
import { Department } from "../entities/department.entity";
import { Position } from "../entities/position.entity";
import { Employee } from "../entities/employee.entity";
import { User } from "../entities/user.entity";
import { Attendance } from "../entities/attendance.entity";
import { Leave } from "../entities/leave.entity";

async function main() {
  const ds = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    host: process.env.POSTGRES_HOST || "localhost",
    port: Number(process.env.POSTGRES_PORT || 5432),
    username: process.env.POSTGRES_USER || "hrms",
    password: process.env.POSTGRES_PASSWORD || "hrms_dev_pass",
    database: process.env.POSTGRES_DB || "hrms",
    entities: ALL_ENTITIES,
    synchronize: true,
    dropSchema: true,
    logging: false,
  });
  await ds.initialize();
  console.log("[seed] schema initialized");

  // ---- Departments ----
  const deptRepo = ds.getRepository(Department);
  const depts = await deptRepo.save([
    { dept_name: "Hành chính - Nhân sự" },
    { dept_name: "Kỹ thuật" },
    { dept_name: "Kinh doanh" },
    { dept_name: "Tài chính - Kế toán" },
    { dept_name: "Chăm sóc khách hàng" },
  ]);

  // ---- Positions ----
  const posRepo = ds.getRepository(Position);
  const positions = await posRepo.save([
    { position_name: "Quản trị viên" },
    { position_name: "Trưởng phòng" },
    { position_name: "Nhân viên HR" },
    { position_name: "Kỹ sư phần mềm" },
    { position_name: "Nhân viên kinh doanh" },
    { position_name: "Kế toán viên" },
  ]);

  // ---- Employees ----
  const empRepo = ds.getRepository(Employee);
  const employees = await empRepo.save([
    { emp_code: "NV000", full_name: "Nguyễn Quản Trị", dob: "1985-05-10",
      gender: "Nam", email: "admin@cty.vn", phone: "0900000000",
      dept_id: depts[0].dept_id, position_id: positions[0].position_id,
      base_salary: 20_000_000, join_date: "2020-01-01",
      leaves_remaining: 12, status: "active" },
    { emp_code: "NV001", full_name: "Lê Thị Hồng HR", dob: "1992-08-15",
      gender: "Nữ", email: "hr01@cty.vn", phone: "0911111111",
      dept_id: depts[0].dept_id, position_id: positions[2].position_id,
      base_salary: 15_000_000, join_date: "2021-03-01",
      leaves_remaining: 12, status: "active" },
    { emp_code: "NV002", full_name: "Trần Văn An", dob: "1995-02-20",
      gender: "Nam", email: "an.nv@cty.vn", phone: "0922222222",
      dept_id: depts[1].dept_id, position_id: positions[3].position_id,
      base_salary: 10_400_000, join_date: "2022-06-15",
      leaves_remaining: 12, status: "active" },
    { emp_code: "NV003", full_name: "Phạm Thị Bình", dob: "1996-11-05",
      gender: "Nữ", email: "binh.nv@cty.vn", phone: "0933333333",
      dept_id: depts[2].dept_id, position_id: positions[4].position_id,
      base_salary: 12_000_000, join_date: "2023-01-10",
      leaves_remaining: 9, status: "active" },
    { emp_code: "NV004", full_name: "Hoàng Minh Đức", dob: "1990-07-30",
      gender: "Nam", email: "duc.nv@cty.vn", phone: "0944444444",
      dept_id: depts[1].dept_id, position_id: positions[1].position_id,
      base_salary: 22_000_000, join_date: "2019-09-01",
      leaves_remaining: 11, status: "active" },
    { emp_code: "NV005", full_name: "Đỗ Thu Hà", dob: "1998-03-25",
      gender: "Nữ", email: "ha.nv@cty.vn", phone: "0955555555",
      dept_id: depts[3].dept_id, position_id: positions[5].position_id,
      base_salary: 11_000_000, join_date: "2023-05-20",
      leaves_remaining: 12, status: "active" },
  ]);

  // ---- Users (TC-01 admin/Admin123, TC-08 user01/User1234 locked) ----
  const userRepo = ds.getRepository(User);
  const h = async (p: string) => bcrypt.hash(p, 10);
  await userRepo.save([
    { username: "admin", password_hash: await h("Admin123"),
      role: "ADMIN", status: "active", employee_id: employees[0].emp_id },
    { username: "hr01", password_hash: await h("Hr012345"),
      role: "HR", status: "active", employee_id: employees[1].emp_id },
    { username: "nv002", password_hash: await h("Nv002345"),
      role: "EMPLOYEE", status: "active", employee_id: employees[2].emp_id },
    { username: "nv003", password_hash: await h("Nv003345"),
      role: "EMPLOYEE", status: "active", employee_id: employees[3].emp_id },
    { username: "nv004", password_hash: await h("Nv004345"),
      role: "EMPLOYEE", status: "active", employee_id: employees[4].emp_id },
    { username: "nv005", password_hash: await h("Nv005345"),
      role: "EMPLOYEE", status: "active", employee_id: employees[5].emp_id },
    { username: "user01", password_hash: await h("User1234"),
      role: "EMPLOYEE", status: "locked", employee_id: null },
  ]);

  // ---- Attendance tháng 5/2026 cho NV002 (20 ngày công) ----
  const attRepo = ds.getRepository(Attendance);
  const nv002 = employees[2].emp_id;
  const nv003 = employees[3].emp_id;
  const days002 = [4, 5, 6, 7, 8, 11, 12, 13, 14, 15,
                   18, 19, 20, 21, 22, 25, 26, 27, 28, 29];
  for (const d of days002) {
    await attRepo.save({
      emp_id: nv002,
      work_date: `2026-05-${String(d).padStart(2, "0")}`,
      check_in: "08:00:00", check_out: "17:00:00", work_hours: 8,
    });
  }
  for (const d of [4, 5, 6, 7, 8]) {
    await attRepo.save({
      emp_id: nv003,
      work_date: `2026-05-${String(d).padStart(2, "0")}`,
      check_in: "08:30:00", check_out: "17:30:00", work_hours: 8,
    });
  }

  // ---- Sample pending leave ----
  await ds.getRepository(Leave).save({
    emp_id: employees[4].emp_id,
    leave_type: "Phép năm",
    start_date: "2026-06-15", end_date: "2026-06-17",
    days_count: 3, reason: "Việc gia đình", status: "pending",
  });

  console.log(`
================================================================
 [seed] Database seeded successfully.
 Demo accounts:
   admin  / Admin123    (ADMIN)
   hr01   / Hr012345    (HR)
   nv002  / Nv002345    (EMPLOYEE - Trần Văn An)
   nv003  / Nv003345    (EMPLOYEE - Phạm Thị Bình)
   user01 / User1234    (LOCKED - cho TC-08)
================================================================
`);
  await ds.destroy();
}

main().catch((err) => {
  console.error("[seed] FAILED:", err);
  process.exit(1);
});
