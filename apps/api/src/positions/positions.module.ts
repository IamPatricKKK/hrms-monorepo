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
import { Position } from "../entities/position.entity";
import { Roles } from "../common/decorators/roles.decorator";

class PosDto {
  @IsString() @IsNotEmpty({ message: "Tên chức vụ là bắt buộc" })
  position_name!: string;
}

@Injectable()
class PositionsService {
  constructor(@InjectRepository(Position) private repo: Repository<Position>) {}

  list() {
    return this.repo
      .createQueryBuilder("p")
      .leftJoin("p.employees", "e")
      .loadRelationCountAndMap("p.employee_count", "p.employees")
      .orderBy("p.position_name", "ASC")
      .getMany();
  }

  async create(dto: PosDto) {
    const exists = await this.repo.findOne({ where: { position_name: dto.position_name } });
    if (exists) throw new BadRequestException("Chức vụ đã tồn tại");
    return this.repo.save(this.repo.create(dto));
  }

  async remove(id: number) {
    const pos = await this.repo.findOne({
      where: { position_id: id }, relations: ["employees"],
    });
    if (!pos) throw new BadRequestException("Không tìm thấy chức vụ");
    if (pos.employees && pos.employees.length > 0) {
      throw new BadRequestException("Không thể xóa: chức vụ đang được dùng");
    }
    await this.repo.delete(id);
    return { deleted: true };
  }
}

@Controller("positions")
class PositionsController {
  constructor(private service: PositionsService) {}

  @Get() list() { return this.service.list(); }

  @Post() @Roles(Role.ADMIN)
  create(@Body() dto: PosDto) { return this.service.create(dto); }

  @Delete(":id") @Roles(Role.ADMIN)
  remove(@Param("id", ParseIntPipe) id: number) { return this.service.remove(id); }
}

@Module({
  imports: [TypeOrmModule.forFeature([Position])],
  controllers: [PositionsController],
  providers: [PositionsService],
})
export class PositionsModule {}
