import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from "class-validator";

export class CreateAttendanceDto {
  @IsInt()
  emp_id!: number;

  @IsDateString()
  work_date!: string;

  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: "Giờ vào không hợp lệ" })
  check_in!: string;

  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: "Giờ ra không hợp lệ" })
  check_out!: string;
}

export class ListAttendanceQuery {
  @IsOptional()
  @IsDateString()
  work_date?: string;

  @IsOptional()
  @IsInt()
  emp_id?: number;
}

export class SummaryQuery {
  @IsInt() @Min(1) @Max(12) month!: number;
  @IsInt() @Min(2020) @Max(2099) year!: number;
}
