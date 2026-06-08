import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { WORK_STANDARD } from "@hrms/shared";
import { Payroll } from "../entities/payroll.entity";
import { Employee } from "../entities/employee.entity";
import { AttendanceService } from "../attendance/attendance.service";
import { CalculatePayrollDto, ListPayrollQuery } from "./dto/payroll.dto";

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(Payroll) private payroll: Repository<Payroll>,
    @InjectRepository(Employee) private employees: Repository<Employee>,
    private attendance: AttendanceService,
  ) {}

  /**
   * FR-04: Tính lương thực nhận.
   *   Lương = (LCB / 26) × NC + PC − TƯ        (BR-07)
   *   Nếu Luong < 0 → 0                         (BR-03)
   *   NC hợp lệ: 0 ≤ NC ≤ 26                    (BR-07)
   *
   * BUG-03 (TC-27): code thiếu vế kiểm tra NC > 26.
   * Bỏ comment dòng đánh dấu BUG-03 để fix.
   */
  static calculate(base: number, work_days: number, allowance = 0, advance = 0): number {
    if (work_days < 0) return -1;
    // if (work_days > WORK_STANDARD) return -1;      // BUG-03: thiếu vế kiểm tra NC > 26
    let salary = (base / WORK_STANDARD) * work_days + allowance - advance;
    if (salary < 0) salary = 0;
    return salary;
  }

  list(query: ListPayrollQuery) {
    const qb = this.payroll
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.employee", "employee")
      .leftJoinAndSelect("employee.department", "department")
      .orderBy("p.year", "DESC")
      .addOrderBy("p.month", "DESC")
      .addOrderBy("p.pay_id", "DESC");
    if (query.month) qb.andWhere("p.month = :m", { m: query.month });
    if (query.year) qb.andWhere("p.year = :y", { y: query.year });
    if (query.emp_id) qb.andWhere("p.emp_id = :e", { e: query.emp_id });
    return qb.getMany();
  }

  async calculatePayroll(dto: CalculatePayrollDto) {
    const emp = await this.employees.findOne({ where: { emp_id: dto.emp_id } });
    if (!emp) throw new NotFoundException("Không tìm thấy nhân viên");

    const work_days = await this.attendance.countWorkDays(
      dto.emp_id, dto.month, dto.year,
    );
    if (work_days === 0) {
      throw new BadRequestException(
        `Chưa có dữ liệu chấm công của ${emp.full_name} tháng ${String(dto.month).padStart(2, "0")}/${dto.year}, không thể tính lương`,
      );
    }

    const existing = await this.payroll.findOne({
      where: { emp_id: dto.emp_id, month: dto.month, year: dto.year },
    });
    if (existing && !dto.confirm_overwrite) {
      throw new ConflictException({
        message: "Đã tồn tại bảng lương kỳ này. Xác nhận tính lại?",
        existing_id: existing.pay_id,
        existing_net_salary: existing.net_salary,
      });
    }

    const salary = PayrollService.calculate(
      emp.base_salary, work_days, dto.allowance ?? 0, dto.advance ?? 0,
    );
    if (salary < 0) {
      throw new BadRequestException("Ngày công không hợp lệ");
    }

    const pay = existing ?? this.payroll.create({
      emp_id: dto.emp_id, month: dto.month, year: dto.year,
    });
    pay.work_days = work_days;
    pay.base_salary = emp.base_salary;
    pay.allowance = dto.allowance ?? 0;
    pay.advance = dto.advance ?? 0;
    pay.net_salary = salary;
    return this.payroll.save(pay);
  }

  myPayslips(emp_id: number) {
    return this.payroll.find({
      where: { emp_id },
      order: { year: "DESC", month: "DESC" },
    });
  }
}
