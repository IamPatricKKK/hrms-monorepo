import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";
import { Leave } from "../entities/leave.entity";
import { Employee } from "../entities/employee.entity";
import { CreateLeaveDto, RejectLeaveDto } from "./dto/leave.dto";

@Injectable()
export class LeavesService {
  constructor(
    @InjectRepository(Leave) private leaves: Repository<Leave>,
    @InjectRepository(Employee) private employees: Repository<Employee>,
  ) {}

  private daysBetween(start: string, end: string): number {
    const s = new Date(start);
    const e = new Date(end);
    return Math.floor((e.getTime() - s.getTime()) / 86_400_000) + 1;
  }

  /**
   * FR-05: kiểm tra tính hợp lệ của đơn nghỉ phép.
   * BUG-04 (TC-36): code dùng >= thay vì > khi so sánh với số phép còn lại,
   * nên đơn 12/12 ngày bị từ chối nhầm.
   * Đổi `>=` thành `>` để fix.
   */
  async validateRequest(employee: Employee, start: string, end: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const s = new Date(start); s.setHours(0, 0, 0, 0);
    const e = new Date(end); e.setHours(0, 0, 0, 0);

    if (e < s) throw new BadRequestException("Khoảng ngày không hợp lệ (ngày kết thúc < ngày bắt đầu)");
    if (s < today) throw new BadRequestException("Ngày bắt đầu phải từ hôm nay trở đi");

    const days = this.daysBetween(start, end);

    // BUG-04: nên là  days > employee.leaves_remaining
    if (days >= employee.leaves_remaining) {
      throw new BadRequestException(
        `Số ngày nghỉ (${days}) vượt quá số phép còn lại (${employee.leaves_remaining})`,
      );
    }

    // C3: không trùng với đơn đã gửi
    const overlap = await this.leaves
      .createQueryBuilder("l")
      .where("l.emp_id = :id", { id: employee.emp_id })
      .andWhere("l.status IN ('pending','approved')")
      .andWhere("l.start_date <= :e", { e: end })
      .andWhere("l.end_date >= :s", { s: start })
      .getOne();
    if (overlap) {
      throw new BadRequestException("Đã tồn tại đơn nghỉ trong khoảng ngày này");
    }

    return days;
  }

  list() {
    return this.leaves.find({
      order: { created_at: "DESC" },
      relations: ["employee", "approver"],
    });
  }

  myLeaves(emp_id: number) {
    return this.leaves.find({
      where: { emp_id },
      order: { created_at: "DESC" },
      relations: ["approver"],
    });
  }

  pending() {
    return this.leaves.find({
      where: { status: "pending" },
      order: { created_at: "ASC" },
      relations: ["employee", "employee.department"],
    });
  }

  async create(emp_id: number, dto: CreateLeaveDto) {
    const emp = await this.employees.findOne({ where: { emp_id } });
    if (!emp) throw new NotFoundException("Hồ sơ nhân viên không tồn tại");
    const days = await this.validateRequest(emp, dto.start_date, dto.end_date);

    const leave = this.leaves.create({
      emp_id,
      leave_type: dto.leave_type ?? "Phép năm",
      start_date: dto.start_date,
      end_date: dto.end_date,
      days_count: days,
      reason: dto.reason,
      status: "pending",
    });
    return this.leaves.save(leave);
  }

  async approve(leave_id: number, approver_id: number) {
    const leave = await this.leaves.findOne({ where: { leave_id } });
    if (!leave || leave.status !== "pending") {
      throw new BadRequestException("Đơn không tồn tại hoặc không ở trạng thái Chờ duyệt");
    }
    const emp = await this.employees.findOne({ where: { emp_id: leave.emp_id } });
    leave.status = "approved";
    leave.approved_by = approver_id;
    await this.leaves.save(leave);
    if (emp) {
      emp.leaves_remaining = Math.max(0, emp.leaves_remaining - leave.days_count);
      await this.employees.save(emp);
    }
    return leave;
  }

  async reject(leave_id: number, approver_id: number, dto: RejectLeaveDto) {
    const leave = await this.leaves.findOne({ where: { leave_id } });
    if (!leave || leave.status !== "pending") {
      throw new BadRequestException("Đơn không tồn tại hoặc không ở trạng thái Chờ duyệt");
    }
    leave.status = "rejected";
    leave.approved_by = approver_id;
    leave.rejection_reason = dto.rejection_reason;
    return this.leaves.save(leave);
  }
}
