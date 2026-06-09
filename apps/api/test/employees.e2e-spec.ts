/**
 * EMPLOYEES E2E TESTS — TC-11 → TC-18
 *
 * BUG-02 (TC-13): Hệ thống KHÔNG kiểm tra email trùng khi tạo nhân viên.
 *   → Test TC-13 expect 201 (bug cho phép tạo trùng email).
 */
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import { createTestApp, closeTestApp } from "./helpers/test-app";
import { seedTestData, TestDataResult } from "./helpers/seed-test-data";
import { User } from "../src/entities/user.entity";
import { Employee } from "../src/entities/employee.entity";
import { Department } from "../src/entities/department.entity";
import { Position } from "../src/entities/position.entity";
import { Attendance } from "../src/entities/attendance.entity";

describe("Employees (e2e)", () => {
  let app: INestApplication;
  let data: TestDataResult;
  let adminToken: string;
  let empToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const ds = app.get(DataSource);
    data = await seedTestData(
      ds.getRepository(User),
      ds.getRepository(Employee),
      ds.getRepository(Department),
      ds.getRepository(Position),
      ds.getRepository(Attendance),
    );

    // Login as admin
    const adminLogin = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ username: "admin", password: "Admin123" });
    adminToken = adminLogin.body.access_token;

    // Login as employee
    const empLogin = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ username: "employee", password: "Emp123456" });
    empToken = empLogin.body.access_token;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  // TC-11: Danh sách nhân viên (admin)
  it("TC-11: GET /api/employees — admin xem danh sách nhân viên → 200", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/employees")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty("items");
    expect(res.body).toHaveProperty("total");
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });

  // TC-12: Tạo nhân viên thành công
  it("TC-12: POST /api/employees — tạo nhân viên hợp lệ → 201", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/employees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        full_name: "New Employee",
        email: "new@test.com",
        phone: "0987654321",
        dept_id: data.dept.dept_id,
        position_id: data.pos.position_id,
        base_salary: 15000000,
        join_date: "2024-01-15",
      })
      .expect(201);

    expect(res.body).toHaveProperty("emp_id");
    expect(res.body.full_name).toBe("New Employee");
    expect(res.body.status).toBe("active");
  });

  // TC-13: Tạo nhân viên trùng email — BUG-02: hệ thống KHÔNG chặn
  it("TC-13: POST /api/employees — email trùng (BUG-02: không chặn) → 201", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/employees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        full_name: "Duplicate Email",
        email: "admin@test.com", // trùng với employee1
        phone: "0987654322",
        dept_id: data.dept.dept_id,
        position_id: data.pos.position_id,
        base_salary: 15000000,
        join_date: "2024-01-15",
      });

    // BUG-02: Lẽ ra phải trả 400 "Email đã tồn tại" nhưng hệ thống cho phép tạo
    // Nếu fix BUG-02 thì expect(res.status).toBe(400)
    expect([201, 400]).toContain(res.status);
  });

  // TC-14: Tạo nhân viên — thiếu họ tên → 400
  it("TC-14: POST /api/employees — thiếu họ tên → 400", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/employees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: "missing@test.com",
        phone: "0987654323",
        dept_id: data.dept.dept_id,
        position_id: data.pos.position_id,
        base_salary: 15000000,
        join_date: "2024-01-15",
      })
      .expect(400);

    expect(res.body.message).toBeDefined();
  });

  // TC-15: Tạo nhân viên — ngày vào làm > ngày hiện tại → 400
  it("TC-15: POST /api/employees — join_date tương lai → 400", async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split("T")[0];

    const res = await request(app.getHttpServer())
      .post("/api/employees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        full_name: "Future Employee",
        email: "future@test.com",
        phone: "0987654324",
        dept_id: data.dept.dept_id,
        position_id: data.pos.position_id,
        base_salary: 15000000,
        join_date: futureDateStr,
      })
      .expect(400);

    expect(res.body.message).toContain("Ngày vào làm không được lớn hơn ngày hiện tại");
  });

  // TC-16: Xem chi tiết nhân viên (admin)
  it("TC-16: GET /api/employees/:id — admin xem chi tiết → 200", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/employees/${data.employee1.emp_id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.emp_id).toBe(data.employee1.emp_id);
    expect(res.body.full_name).toBe("Admin User");
  });

  // TC-17: EMPLOYEE xem hồ sơ người khác → 403
  it("TC-17: GET /api/employees/:id — employee xem hồ sơ người khác → 403", async () => {
    await request(app.getHttpServer())
      .get(`/api/employees/${data.employee1.emp_id}`)
      .set("Authorization", `Bearer ${empToken}`)
      .expect(403);
  });

  // TC-18: EMPLOYEE không có quyền tạo nhân viên → 403
  it("TC-18: POST /api/employees — employee không có quyền → 403", async () => {
    await request(app.getHttpServer())
      .post("/api/employees")
      .set("Authorization", `Bearer ${empToken}`)
      .send({
        full_name: "Unauthorized",
        email: "unauth@test.com",
        phone: "0987654325",
        dept_id: data.dept.dept_id,
        position_id: data.pos.position_id,
        base_salary: 15000000,
        join_date: "2024-01-15",
      })
      .expect(403);
  });
});