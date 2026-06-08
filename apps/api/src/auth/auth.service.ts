import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import {
  LOGIN_LOCK_AFTER_FAILS,
  LOGIN_LOCK_MINUTES,
  PASSWORD_HAS_DIGIT,
  PASSWORD_HAS_LETTER,
  PASSWORD_MIN_LENGTH,
  Role,
  USERNAME_REGEX,
} from "@hrms/shared";
import { User } from "../entities/user.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private jwt: JwtService,
  ) {}

  validateUsername(username: string): string | null {
    if (!username) return "Vui lòng nhập tên đăng nhập";
    if (username.length < 4) return "Username phải từ 4 đến 20 ký tự";
    // BUG-01 (TC-03): bỏ qua kiểm tra độ dài tối đa - giữ nguyên theo báo cáo.
    // if (username.length > 20) return "Username phải từ 4 đến 20 ký tự";
    if (!USERNAME_REGEX.test(username)) {
      // Vì BUG-01 vẫn cho phép username > 20 ký tự, ta nới regex bỏ check length:
      const onlyAlnum = /^[A-Za-z0-9]+$/;
      if (!onlyAlnum.test(username)) {
        return "Username chỉ gồm chữ cái và chữ số";
      }
    }
    return null;
  }

  validatePassword(password: string): string | null {
    if (!password) return "Vui lòng nhập mật khẩu";
    if (password.length < PASSWORD_MIN_LENGTH) return "Password tối thiểu 8 ký tự";
    if (!(PASSWORD_HAS_LETTER.test(password) && PASSWORD_HAS_DIGIT.test(password))) {
      return "Password phải gồm cả chữ và số";
    }
    return null;
  }

  async login(username: string, password: string) {
    const uErr = this.validateUsername(username);
    const pErr = this.validatePassword(password);
    if (uErr) throw new BadRequestException(uErr);
    if (pErr) throw new BadRequestException(pErr);

    const user = await this.users.findOne({
      where: { username },
      relations: ["employee"],
    });
    if (!user) throw new UnauthorizedException("Sai tài khoản hoặc mật khẩu");

    if (user.status === "locked") {
      throw new UnauthorizedException("Tài khoản đã bị khóa");
    }

    if (user.locked_until && user.locked_until > new Date()) {
      const minutes = Math.ceil(
        (user.locked_until.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Tài khoản tạm khóa, thử lại sau ${minutes} phút`,
      );
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      user.failed_logins = (user.failed_logins || 0) + 1;
      if (user.failed_logins >= LOGIN_LOCK_AFTER_FAILS) {
        user.locked_until = new Date(Date.now() + LOGIN_LOCK_MINUTES * 60_000);
        user.failed_logins = 0;
        await this.users.save(user);
        throw new UnauthorizedException(
          `Sai quá ${LOGIN_LOCK_AFTER_FAILS} lần, tài khoản tạm khóa ${LOGIN_LOCK_MINUTES} phút`,
        );
      }
      await this.users.save(user);
      throw new UnauthorizedException("Sai tài khoản hoặc mật khẩu");
    }

    user.failed_logins = 0;
    user.locked_until = null;
    await this.users.save(user);

    const payload = {
      sub: user.user_id,
      username: user.username,
      role: user.role,
      employee_id: user.employee_id,
    };
    const access_token = await this.jwt.signAsync(payload);

    return {
      access_token,
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role as Role,
        employee_id: user.employee_id,
        full_name: user.employee?.full_name ?? null,
      },
    };
  }

  async me(userId: number) {
    const user = await this.users.findOne({
      where: { user_id: userId },
      relations: ["employee"],
    });
    if (!user) throw new UnauthorizedException();
    return {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      employee_id: user.employee_id,
      full_name: user.employee?.full_name ?? null,
    };
  }
}
