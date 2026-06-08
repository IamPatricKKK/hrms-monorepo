import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../common/decorators/current-user.decorator";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || "change-this-in-production-32-chars-long",
    });
  }

  async validate(payload: JwtPayload) {
    return {
      user_id: payload.sub,
      username: payload.username,
      role: payload.role,
      employee_id: payload.employee_id,
    };
  }
}
