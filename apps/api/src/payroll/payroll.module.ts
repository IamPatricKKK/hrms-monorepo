import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Payroll } from "../entities/payroll.entity";
import { Employee } from "../entities/employee.entity";
import { AttendanceModule } from "../attendance/attendance.module";
import { PayrollController } from "./payroll.controller";
import { PayrollService } from "./payroll.service";

@Module({
  imports: [TypeOrmModule.forFeature([Payroll, Employee]), AttendanceModule],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
