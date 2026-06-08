import { IsBoolean, IsInt, IsOptional, Max, Min } from "class-validator";

export class CalculatePayrollDto {
  @IsInt() emp_id!: number;
  @IsInt() @Min(1) @Max(12) month!: number;
  @IsInt() @Min(2020) @Max(2099) year!: number;

  @IsOptional() @IsInt() @Min(0) allowance?: number;
  @IsOptional() @IsInt() @Min(0) advance?: number;

  @IsOptional() @IsBoolean()
  confirm_overwrite?: boolean;
}

export class ListPayrollQuery {
  @IsOptional() @IsInt() @Min(1) @Max(12) month?: number;
  @IsOptional() @IsInt() @Min(2020) @Max(2099) year?: number;
  @IsOptional() @IsInt() emp_id?: number;
}
