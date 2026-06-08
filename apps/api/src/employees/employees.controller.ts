import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { Role } from "@hrms/shared";
import { Roles } from "../common/decorators/roles.decorator";
import {
  CurrentUser,
  JwtPayload,
} from "../common/decorators/current-user.decorator";
import {
  CreateEmployeeDto,
  ListEmployeesQuery,
  UpdateEmployeeDto,
} from "./dto/employee.dto";
import { EmployeesService } from "./employees.service";

@Controller("employees")
export class EmployeesController {
  constructor(private service: EmployeesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.HR)
  list(@Query() query: ListEmployeesQuery) {
    return this.service.list(query);
  }

  @Get(":id")
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.service.assertCanView(id, user);
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.HR)
  create(@Body() dto: CreateEmployeeDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @Roles(Role.ADMIN, Role.HR)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @Roles(Role.ADMIN, Role.HR)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
