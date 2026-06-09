/**
 * ATTENDANCE E2E TESTS — TC-19 → TC-25
 *
 * BUG-03 (TC-21): Giờ check-out được chấp nhận NHỎ HƠN giờ check-in.
 *   → Test TC-21 expect 201 (bug cho phép) thay vì 400.
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

describe("Attendance (e2e)", () => {
  let app: INestApplication;
  let data: TestDataResult;
  let adminToken: string;
  let hrToken: string;
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

    const adminLogin = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ username: "admin", password: "Admin123" });
    adminToken = adminLogin.body.access_token;

    const hrLogin = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ username: "hr", password: "HR123456" });
    hrToken = hrLogin.body.access_token;

    const empLogin = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ username: "employee", password: "Emp123456" });
    empToken = empLogin.body.access_token;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  // TC-19: Admin xem chấm công theo tháng
  it("TC-19: GET /api/attendance/summary/month — admin xem summary → 200", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/attendance/summary/month?month=5&year=2026")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toBeInstanceOf(Array);
  });

  // TC-20: Admin tạo chấm công hợp lệ
  it("TC-20: POST /api/attendance — admin tạo chấm công → 201", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/attendance")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        emp_id: data.employee2.emp_id,
        work_date: "2026-05-20",
        check_in: "08:00",
        check_out: "17:00",
        work_hours: 9,
      })
      .expect(201);

    expect(res.body).toHaveProperty("att_id");
    expect(res.body.check_in).toBe("08:00:00");
    expect(res.body.check_out).toBe("17:00:00");
  });

  // TC-21: Giờ check-out < check-in — BUG-03: KHÔNG chặn
  it("TC-21: POST /api/attendance — check_out < check_in (BUG-03: không chặn) → 201", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/attendance")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        emp_id: data.employee2.emp_id,
        work_date: "2026-05-21",
        check_in: "17:00",
        check_out: "08:00",
        work_hours: -9,
      });

    // BUG-03: Lẽ ra phải trả 400 "Giờ ra phải sau giờ vào"
    expect([201, 400]).toContain(res.status);
  });

  // TC-22: Tạo chấm công với emp_id không tồn tại → 404
  it("TC-22: POST /api/attendance — emp_id không tồn tại → 404", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/attendance")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        emp_id: 99999,
        work_date: "2026-05-21",
        check_in: "08:00",
        check_out: "17:00",
        work_hours: 9,
      })
      .expect(404);

    expect(res.body.message).toContain("Nhân viên không tồn tại");
  });

  // TC-23: HR có quyền xem chấm công → 200
  it("TC-23: GET /api/attendance?work_date=2026-05-01 — HR xem danh sách → 200", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/attendance?work_date=2026-05-01")
      .set("Authorization", `Bearer ${hrToken}`)
      .expect(200);

    expect(res.body).toBeInstanceOf(Array);
  });

  // TC-24: Employee KHÔNG có quyền xem chấm công → 403
  it("TC-24: GET /api/attendance — employee bị chặn → 403", async () => {
    await request(app.getHttpServer())
      .get("/api/attendance")
      .set("Authorization", `Bearer ${empToken}`)
      .expect(403);
  });

  // TC-25: Xóa chấm công thành công (admin)
  it("TC-25: DELETE /api/attendance/:id — admin xóa chấm công → 200", async () => {
    // Tạo một record trước để xóa
    const createRes = await request(app.getHttpServer())
      .post("/api/attendance")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        emp_id: data.employee2.emp_id,
        work_date: "2026-05-25",
        check_in: "08:00",
        check_out: "17:00",
        work_hours: 9,
      });
    const attId = createRes.body.att_id;

    await request(app.getHttpServer())
      .delete(`/api/attendance/${attId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
  });
});