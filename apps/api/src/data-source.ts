import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { Department } from "./entities/department.entity";
import { Position } from "./entities/position.entity";
import { Employee } from "./entities/employee.entity";
import { User } from "./entities/user.entity";
import { Attendance } from "./entities/attendance.entity";
import { Payroll } from "./entities/payroll.entity";
import { Leave } from "./entities/leave.entity";

export const ALL_ENTITIES = [
  Department,
  Position,
  Employee,
  User,
  Attendance,
  Payroll,
  Leave,
];

export const dataSourceOptions = (): TypeOrmModuleOptions => {
  const url = process.env.DATABASE_URL;
  if (url) {
    return {
      type: "postgres",
      url,
      entities: ALL_ENTITIES,
      synchronize: true,
      logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : false,
    };
  }
  return {
    type: "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    port: Number(process.env.POSTGRES_PORT || 5432),
    username: process.env.POSTGRES_USER || "hrms",
    password: process.env.POSTGRES_PASSWORD || "hrms_dev_pass",
    database: process.env.POSTGRES_DB || "hrms",
    entities: ALL_ENTITIES,
    synchronize: true,
    logging: false,
  };
};
