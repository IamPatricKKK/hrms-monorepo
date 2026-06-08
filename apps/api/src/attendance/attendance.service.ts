import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Attendance } from "../entities/attendance.entity";
import { Employee } from "../entities/employee.entity";
import { CreateAttendanceDto } from "./dto/attendance.dto";

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance) private repo: Repository<Attendance>,
    @InjectRepository(Employee) private employees: Repository<Employee>,
  ) {}

  list(work_date?: string, emp_id?: number) {
    const qb = this.repo
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.employee", "employee")
      .leftJoinAndSelect("employee.department", "department")
      .orderBy("a.work_date", "DESC")
      .addOrderBy("a.att_id", "DESC");
    if (work_date) qb.andWhere("a.work_date = :d", { d: work_date });
    if (emp_id) qb.andWhere("a.emp_id = :e", { e: emp_id });
    return qb.getMany();
  }

  async create(dto: CreateAttendanceDto) {
    if (dto.check_out <= dto.check_in) {
      throw new BadRequestException("Giờ ra phải lớn hơn giờ vào");
    }
    const dup = await this.repo.findOne({
      where: { emp_id: dto.emp_id, work_date: dto.work_date },
    });
    if (dup) {
      throw new BadRequestException("Ngày này đã được chấm công");
    }
    const [hIn, mIn] = dto.check_in.split(":").map(Number);
    const [hOut, mOut] = dto.check_out.split(":").map(Number);
    const hours = (hOut + mOut / 60) - (hIn + mIn / 60);
    const att = this.repo.create({ ...dto, work_hours: hours });
    return this.repo.save(att);
  }

  async remove(id: number) {
    const att = await this.repo.findOne({ where: { att_id: id } });
    if (!att) throw new NotFoundException("Không tìm thấy bản ghi");
    await this.repo.delete(id);
    return { deleted: true };
  }

  async summary(month: number, year: number) {
    const employees = await this.employees.find({
      where: { status: "active" },
      order: { emp_code: "ASC" },
      relations: ["department"],
    });
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    const rows = await Promise.all(
      employees.map(async (e) => {
        const count = await this.repo
          .createQueryBuilder("a")
          .where("a.emp_id = :id", { id: e.emp_id })
          .andWhere("a.work_date >= :s", { s: startDate })
          .andWhere("a.work_date < :e", { e: endDate })
          .getCount();
        return { employee: e, work_days: count };
      }),
    );
    return rows;
  }

  async countWorkDays(emp_id: number, month: number, year: number) {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
    return this.repo
      .createQueryBuilder("a")
      .where("a.emp_id = :id", { id: emp_id })
      .andWhere("a.work_date >= :s", { s: startDate })
      .andWhere("a.work_date < :e", { e: endDate })
      .getCount();
  }
}
