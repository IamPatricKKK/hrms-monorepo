import { Module, Controller, Get } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_GUARD } from "@nestjs/core";
import { dataSourceOptions } from "./data-source";
import { AuthModule } from "./auth/auth.module";
import { EmployeesModule } from "./employees/employees.module";
import { AttendanceModule } from "./attendance/attendance.module";
import { PayrollModule } from "./payroll/payroll.module";
import { LeavesModule } from "./leaves/leaves.module";
import { DepartmentsModule } from "./departments/departments.module";
import { PositionsModule } from "./positions/positions.module";
import { UsersModule } from "./users/users.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";

@Controller("health")
class HealthController {
  @Get()
  ping() {
    return { status: "ok", time: new Date().toISOString() };
  }
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({ useFactory: () => dataSourceOptions() }),
    AuthModule,
    UsersModule,
    EmployeesModule,
    DepartmentsModule,
    PositionsModule,
    AttendanceModule,
    PayrollModule,
    LeavesModule,
    DashboardModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
