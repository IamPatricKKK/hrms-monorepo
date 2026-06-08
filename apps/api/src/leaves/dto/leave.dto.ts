import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateLeaveDto {
  @IsOptional()
  @IsString()
  leave_type?: string;

  @IsDateString({}, { message: "Ngày bắt đầu không hợp lệ" })
  start_date!: string;

  @IsDateString({}, { message: "Ngày kết thúc không hợp lệ" })
  end_date!: string;

  @IsString()
  @IsNotEmpty({ message: "Vui lòng nhập lý do" })
  reason!: string;
}

export class RejectLeaveDto {
  @IsString()
  @IsNotEmpty({ message: "Vui lòng nhập lý do từ chối" })
  rejection_reason!: string;
}
