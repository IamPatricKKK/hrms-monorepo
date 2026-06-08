import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { TypeOrmModule, InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IsNotEmpty, IsString } from "class-validator";
import { Role } from "@hrms/shared";
import { Department } from "../entities/department.entity";
import { Roles } from "../common/decorators/roles.decorator";

class DeptDto {
  @IsString() @IsNotEmpty({ message: "Tên phòng ban là bắt buộc" })
  dept_name!: string;
}

@Injectable()
class DepartmentsService {
  constructor(@InjectRepository(Department) private repo: Repository<Department>) {}

  list() {
    return this.repo
      .createQueryBuilder("d")
      .leftJoin("d.employees", "e")
      .loadRelationCountAndMap("d.employee_count", "d.employees")
      .orderBy("d.dept_name", "ASC")
      .getMany();
  }

  async create(dto: DeptDto) {
    const exists = await this.repo.findOne({ where: { dept_name: dto.dept_name } });
    if (exists) throw new BadRequestException("Phòng ban đã tồn tại");
    return this.repo.save(this.repo.create(dto));
  }

  async remove(id: number) {
    const dept = await this.repo.findOne({
      where: { dept_id: id }, relations: ["employees"],
    });
    if (!dept) throw new BadRequestException("Không tìm thấy phòng ban");
    if (dept.employees && dept.employees.length > 0) {
      throw new BadRequestException("Không thể xóa: phòng ban đang có nhân viên");
    }
    await this.repo.delete(id);
    return { deleted: true };
  }
}

@Controller("departments")
class DepartmentsController {
  constructor(private service: DepartmentsService) {}

  @Get() list() { return this.service.list(); }

  @Post() @Roles(Role.ADMIN)
  create(@Body() dto: DeptDto) { return this.service.create(dto); }

  @Delete(":id") @Roles(Role.ADMIN)
  remove(@Param("id", ParseIntPipe) id: number) { return this.service.remove(id); }
}

@Module({
  imports: [TypeOrmModule.forFeature([Department])],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
})
export class DepartmentsModule {}
