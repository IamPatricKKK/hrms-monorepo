import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
import { Role } from "@hrms/shared";
import { Roles } from "../common/decorators/roles.decorator";
import { AttendanceService } from "./attendance.service";
import {
  CreateAttendanceDto,
  ListAttendanceQuery,
  SummaryQuery,
} from "./dto/attendance.dto";

@Controller("attendance")
@Roles(Role.ADMIN, Role.HR)
export class AttendanceController {
  constructor(private service: AttendanceService) {}

  @Get()
  list(@Query() q: ListAttendanceQuery) {
    return this.service.list(q.work_date, q.emp_id);
  }

  @Post()
  create(@Body() dto: CreateAttendanceDto) {
    return this.service.create(dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Get("summary/month")
  summary(@Query() q: SummaryQuery) {
    return this.service.summary(q.month, q.year);
  }
}
