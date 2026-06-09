import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "../../src/entities/user.entity";
import { Employee } from "../../src/entities/employee.entity";
import { Department } from "../../src/entities/department.entity";
import { Position } from "../../src/entities/position.entity";
import { Attendance } from "../../src/entities/attendance.entity";

export interface TestDataResult {
  adminUser: User;
  hrUser: User;
  lockedUser: User;
  employee1: Employee;
  employee2: Employee;
  dept: Department;
  pos: Position;
}

export async function seedTestData(
  userRepo: Repository<User>,
  employeeRepo: Repository<Employee>,
  deptRepo: Repository<Department>,
  posRepo: Repository<Position>,
  attRepo: Repository<Attendance>,
): Promise<TestDataResult> {
  // Create department
  const dept = deptRepo.create({
    dept_name: "IT Department",
  });
  await deptRepo.save(dept);

  // Create position
  const pos = posRepo.create({
    position_name: "Software Engineer",
  });
  await posRepo.save(pos);

  // Create employees
  const hashPassword = (pwd: string) => bcrypt.hashSync(pwd, 10);

  // Employee 1 (linked to admin user)
  const emp1 = employeeRepo.create({
    emp_code: "EMP001",
    full_name: "Admin User",
    email: "admin@test.com",
    phone: "0123456789",
    dept_id: dept.dept_id,
    position_id: pos.position_id,
    base_salary: 50000000,
    join_date: "2020-01-01",
    leaves_remaining: 12,
    status: "active",
  });
  await employeeRepo.save(emp1);

  // Employee 2 (linked to HR user)
  const emp2 = employeeRepo.create({
    emp_code: "EMP002",
    full_name: "HR User",
    email: "hr@test.com",
    phone: "0123456788",
    dept_id: dept.dept_id,
    position_id: pos.position_id,
    base_salary: 40000000,
    join_date: "2021-01-01",
    leaves_remaining: 12,
    status: "active",
  });
  await employeeRepo.save(emp2);

  // Employee 3 (regular employee)
  const emp3 = employeeRepo.create({
    emp_code: "EMP003",
    full_name: "John Employee",
    email: "john@test.com",
    phone: "0123456787",
    dept_id: dept.dept_id,
    position_id: pos.position_id,
    base_salary: 25000000,
    join_date: "2022-01-01",
    leaves_remaining: 12,
    status: "active",
  });
  await employeeRepo.save(emp3);

  // Create users
  const adminUser = userRepo.create({
    username: "admin",
    password_hash: hashPassword("Admin123"),
    role: "ADMIN",
    status: "active",
    employee_id: emp1.emp_id,
  });
  await userRepo.save(adminUser);

  const hrUser = userRepo.create({
    username: "hr",
    password_hash: hashPassword("HR123456"),
    role: "HR",
    status: "active",
    employee_id: emp2.emp_id,
  });
  await userRepo.save(hrUser);

  const empUser = userRepo.create({
    username: "employee",
    password_hash: hashPassword("Emp123456"),
    role: "EMPLOYEE",
    status: "active",
    employee_id: emp3.emp_id,
  });
  await userRepo.save(empUser);

  // Locked user
  const lockedUser = userRepo.create({
    username: "locked_user",
    password_hash: hashPassword("Lock123456"),
    role: "EMPLOYEE",
    status: "locked",
  });
  await userRepo.save(lockedUser);

  // Seed attendance for May 2026 (workdays)
  const may2026Workdays = [
    "2026-05-01", "2026-05-04", "2026-05-05", "2026-05-06", "2026-05-07", "2026-05-08",
    "2026-05-11", "2026-05-12", "2026-05-13", "2026-05-14", "2026-05-15",
    "2026-05-18", "2026-05-19", "2026-05-20", "2026-05-21", "2026-05-22",
    "2026-05-25", "2026-05-26", "2026-05-27", "2026-05-28", "2026-05-29",
  ];

  for (const date of may2026Workdays) {
    const att = attRepo.create({
      emp_id: emp3.emp_id,
      work_date: date,
      check_in: "08:00:00",
      check_out: "17:00:00",
      work_hours: 9,
    });
    await attRepo.save(att);
  }

  return {
    adminUser,
    hrUser,
    lockedUser,
    employee1: emp1,
    employee2: emp2,
    dept,
    pos,
  };
}