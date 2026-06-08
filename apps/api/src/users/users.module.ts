import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { TypeOrmModule, InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Role } from "@hrms/shared";
import { User } from "../entities/user.entity";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthService } from "../auth/auth.service";
import { AuthModule } from "../auth/auth.module";

class CreateUserDto {
  @IsString() @IsNotEmpty() username!: string;
  @IsString() @IsNotEmpty() password!: string;
  @IsEnum(Role) role!: Role;
  @IsOptional() @IsInt() employee_id?: number;
}

class ResetPasswordDto {
  @IsString() @IsNotEmpty() new_password!: string;
}

@Injectable()
class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    private auth: AuthService,
  ) {}

  list() {
    return this.repo.find({
      relations: ["employee"],
      order: { username: "ASC" },
      select: {
        user_id: true, username: true, role: true, status: true,
        employee_id: true, failed_logins: true, locked_until: true,
        created_at: true,
      },
    });
  }

  async create(dto: CreateUserDto) {
    if (this.auth.validateUsername(dto.username)) {
      throw new BadRequestException("Username không hợp lệ");
    }
    if (this.auth.validatePassword(dto.password)) {
      throw new BadRequestException("Password không hợp lệ");
    }
    const exists = await this.repo.findOne({ where: { username: dto.username } });
    if (exists) throw new BadRequestException("Username đã tồn tại");

    const user = this.repo.create({
      username: dto.username,
      password_hash: await bcrypt.hash(dto.password, 10),
      role: dto.role,
      status: "active",
      employee_id: dto.employee_id ?? null,
    });
    return this.repo.save(user);
  }

  async toggleLock(id: number) {
    const user = await this.repo.findOne({ where: { user_id: id } });
    if (!user) throw new BadRequestException("Không tìm thấy");
    user.status = user.status === "active" ? "locked" : "active";
    if (user.status === "active") {
      user.locked_until = null;
      user.failed_logins = 0;
    }
    return this.repo.save(user);
  }

  async resetPassword(id: number, dto: ResetPasswordDto) {
    if (this.auth.validatePassword(dto.new_password)) {
      throw new BadRequestException("Password mới không hợp lệ");
    }
    const user = await this.repo.findOne({ where: { user_id: id } });
    if (!user) throw new BadRequestException("Không tìm thấy");
    user.password_hash = await bcrypt.hash(dto.new_password, 10);
    await this.repo.save(user);
    return { ok: true };
  }
}

@Controller("users")
@Roles(Role.ADMIN)
class UsersController {
  constructor(private service: UsersService) {}

  @Get() list() { return this.service.list(); }

  @Post() create(@Body() dto: CreateUserDto) { return this.service.create(dto); }

  @Post(":id/toggle-lock")
  toggle(@Param("id", ParseIntPipe) id: number) {
    return this.service.toggleLock(id);
  }

  @Post(":id/reset-password")
  reset(@Param("id", ParseIntPipe) id: number, @Body() dto: ResetPasswordDto) {
    return this.service.resetPassword(id, dto);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
