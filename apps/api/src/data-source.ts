import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DataSourceOptions } from "typeorm";
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

// Glob khớp cả .ts (ts-node/CLI) lẫn .js (đã build trong dist)
export const MIGRATIONS_GLOB = __dirname + "/migrations/*.{ts,js}";

const isTestEnv =
  process.env.NODE_ENV === "test" || process.env.E2E_SQLITE === "1";

// synchronize CHỈ bật ở test, hoặc khi cố ý đặt DB_SYNCHRONIZE=true (dev nhanh).
// Production: false → schema quản lý bằng migration.
const useSync = isTestEnv || process.env.DB_SYNCHRONIZE === "true";

/** Thông tin kết nối Postgres dùng chung cho Nest và TypeORM CLI. */
export const pgConnectionOptions = (): DataSourceOptions => {
  const url = process.env.DATABASE_URL;
  if (url) {
    return { type: "postgres", url } as DataSourceOptions;
  }
  return {
    type: "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    port: Number(process.env.POSTGRES_PORT || 5432),
    username: process.env.POSTGRES_USER || "hrms",
    password: process.env.POSTGRES_PASSWORD || "hrms_dev_pass",
    database: process.env.POSTGRES_DB || "hrms",
  } as DataSourceOptions;
};

export const dataSourceOptions = (): TypeOrmModuleOptions => {
  if (isTestEnv) {
    return {
      type: "better-sqlite3",
      database: ":memory:",
      entities: ALL_ENTITIES,
      synchronize: true,
      dropSchema: true,
      logging: false,
    };
  }

  return {
    ...pgConnectionOptions(),
    entities: ALL_ENTITIES,
    migrations: [MIGRATIONS_GLOB],
    synchronize: useSync,
    // App KHÔNG tự chạy migration lúc boot — để job `migrate` trong CI kiểm soát.
    migrationsRun: false,
    logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : false,
  } as TypeOrmModuleOptions;
};
