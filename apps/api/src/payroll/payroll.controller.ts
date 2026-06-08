import { Body, Controller, ForbiddenException, Get, Post, Query } from "@nestjs/common";
import { Role } from "@hrms/shared";
import { Roles } from "../common/decorators/roles.decorator";
import {
  CurrentUser,
  JwtPayload,
} from "../common/decorators/current-user.decorator";
import { PayrollService } from "./payroll.service";
import { CalculatePayrollDto, ListPayrollQuery } from "./dto/payroll.dto";

@Controller("payroll")
export class PayrollController {
  constructor(private service: PayrollService) {}

  @Get()
  @Roles(Role.ADMIN, Role.HR)
  list(@Query() q: ListPayrollQuery) {
    return this.service.list(q);
  }

  @Post("calculate")
  @Roles(Role.ADMIN, Role.HR)
  calculate(@Body() dto: CalculatePayrollDto) {
    return this.service.calculatePayroll(dto);
  }

  @Get("me")
  myPayslips(@CurrentUser() user: JwtPayload) {
    if (!user.employee_id) {
      throw new ForbiddenException("Tài khoản chưa gắn với hồ sơ nhân viên");
    }
    return this.service.myPayslips(user.employee_id);
  }
}
