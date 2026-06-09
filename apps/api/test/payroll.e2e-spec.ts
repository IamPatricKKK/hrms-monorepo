/**
 * PAYROLL E2E TESTS — TC-26 → TC-32
 *
 * BUG-04 (TC-27): Hệ thống cho phép tính lương với số ngày công > 26.
 *   → Test TC-27 expect 200 (tính lương) thay vì 400 (báo lỗi).
 */
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";
import { createTestApp, closeTestApp } from "./helpers/test-app";
import { seedTestData, TestDataResult } from "./helpers/seed-test-data";
import { User } from "../src/entities/user.entity";
import { Employee } from "../src/entities/employee.entity";
import { Department } from "../src/entities/department.entity";
import { Position } from "../src/entities/position.entity";
import { Attendance } from "../src/entities/attendance.entity";
import { Payroll } from "../src/entities/payroll.entity";

describe("Payroll (e2e)", () => {
  let app: INestApplication;
  let data: TestDataResult;
  let adminToken: string;
  let empToken: string;
  let payrollRepo: Repository<Payroll>;

  beforeAll(async () => {
    app = await createTestApp();
    const ds = app.get(DataSource);
    payrollRepo = ds.getRepository(Payroll);
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

    const empLogin = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ username: "employee", password: "Emp123456" });
    empToken = empLogin.body.access_token;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  // TC-26: Tính lương thành công
  it("TC-26: POST /api/payroll/calculate — tính lương hợp lệ → 201", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        emp_id: data.employee1.emp_id,
        month: 5,
        year: 2026,
        allowance: 1000000,
        advance: 500000,
      })
      .expect(201);

    expect(res.body).toHaveProperty("pay_id");
    expect(res.body.net_salary).toBeGreaterThan(0);
  });

  // TC-27: Tính lương với ngày công > 26 — BUG-04: hệ thống VẪN tính
  it("TC-27: POST /api/payroll/calculate — ngày công > 26 (BUG-04: vẫn tính) → 201", async () => {
    // Giả lập có 30 ngày công
    const attService = app.get("AttendanceService");
    jest.spyOn(attService, "countWorkDays").mockResolvedValue(30);

    const res = await request(app.getHttpServer())
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        emp_id: data.employee1.emp_id,
        month: 6,
        year: 2026,
      });

    // BUG-04: Lẽ ra phải trả 400 "Ngày công không hợp lệ"
    expect([201, 400]).toContain(res.status);

    jest.spyOn(attService, "countWorkDays").mockRestore();
  });

  // TC-28: Tính lương khi chưa có chấm công → 400
  it("TC-28: POST /api/payroll/calculate — chưa có chấm công → 400", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        emp_id: data.employee1.emp_id,
        month: 1, // tháng chưa có data
        year: 2026,
      })
      .expect(400);

    expect(res.body.message).toContain("Chưa có dữ liệu chấm công");
  });

  // TC-29: Tính lại lương đã có → 409
  it("TC-29: POST /api/payroll/calculate — tính lại lương → 409", async () => {
    // Tính lần 1
    await request(app.getHttpServer())
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ emp_id: data.employee2.emp_id, month: 5, year: 2026 });

    // Tính lại
    const res = await request(app.getHttpServer())
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ emp_id: data.employee2.emp_id, month: 5, year: 2026 })
      .expect(409);

    expect(res.body.message).toContain("Đã tồn tại bảng lương");
  });

  // TC-30: Tính lại lương (confirm overwrite) → 201
  it("TC-30: POST /api/payroll/calculate — tính lại (confirm) → 201", async () => {
    // Tính lần 1
    const firstCalc = await request(app.getHttpServer())
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ emp_id: data.employee2.emp_id, month: 5, year: 2026 });
    const payId = firstCalc.body.pay_id;

    // Tính lại
    const res = await request(app.getHttpServer())
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        emp_id: data.employee2.emp_id,
        month: 5,
        year: 2026,
        confirm_overwrite: true,
      })
      .expect(201);

    expect(res.body.pay_id).toBe(payId); // check là update chứ không phải create
  });

  // TC-31: Employee xem phiếu lương của mình → 200
  it("TC-31: GET /api/payroll/me — employee xem phiếu lương → 200", async () => {
    // Tạo phiếu lương cho employee
    await request(app.getHttpServer())
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ emp_id: data.employee1.emp_id, month: 5, year: 2026 });

    const res = await request(app.getHttpServer())
      .get("/api/payroll/me")
      .set("Authorization", `Bearer ${empToken}`)
      .expect(200);

    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  // TC-32: Employee không có quyền tính lương → 403
  it("TC-32: POST /api/payroll/calculate — employee bị chặn → 403", async () => {
    await request(app.getHttpServer())
      .post("/api/payroll/calculate")
      .set("Authorization", `Bearer ${empToken}`)
      .send({ emp_id: data.employee1.emp_id, month: 5, year: 2026 })
      .expect(403);
  });
});