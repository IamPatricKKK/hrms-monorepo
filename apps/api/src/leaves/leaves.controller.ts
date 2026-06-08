import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { Role } from "@hrms/shared";
import { Roles } from "../common/decorators/roles.decorator";
import {
  CurrentUser,
  JwtPayload,
} from "../common/decorators/current-user.decorator";
import { LeavesService } from "./leaves.service";
import { CreateLeaveDto, RejectLeaveDto } from "./dto/leave.dto";

@Controller("leaves")
export class LeavesController {
  constructor(private service: LeavesService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    if (user.role === "EMPLOYEE") {
      if (!user.employee_id) return [];
      return this.service.myLeaves(user.employee_id);
    }
    return this.service.list();
  }

  @Get("pending")
  @Roles(Role.ADMIN, Role.HR)
  pending() {
    return this.service.pending();
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateLeaveDto) {
    if (user.role !== "EMPLOYEE" || !user.employee_id) {
      throw new ForbiddenException("Chỉ nhân viên mới được gửi đơn nghỉ phép");
    }
    return this.service.create(user.employee_id, dto);
  }

  @Post(":id/approve")
  @Roles(Role.ADMIN, Role.HR)
  approve(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.approve(id, user.sub);
  }

  @Post(":id/reject")
  @Roles(Role.ADMIN, Role.HR)
  reject(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RejectLeaveDto,
  ) {
    return this.service.reject(id, user.sub, dto);
  }
}
