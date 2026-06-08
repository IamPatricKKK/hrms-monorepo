import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  Min,
} from "class-validator";

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty({ message: "Họ tên là bắt buộc" })
  full_name!: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsEmail({}, { message: "Email sai định dạng" })
  email!: string;

  @Matches(/^\d{10}$/, { message: "Số điện thoại phải gồm đúng 10 chữ số" })
  phone!: string;

  @IsInt({ message: "Vui lòng chọn phòng ban" })
  dept_id!: number;

  @IsInt({ message: "Vui lòng chọn chức vụ" })
  position_id!: number;

  @IsPositive({ message: "Lương cơ bản phải là số dương" })
  base_salary!: number;

  @IsDateString({}, { message: "Ngày vào làm không hợp lệ" })
  join_date!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(12)
  leaves_remaining?: number;
}

export class UpdateEmployeeDto extends CreateEmployeeDto {}

export class ListEmployeesQuery {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  dept_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  page_size?: number;
}
