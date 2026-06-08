import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { Employee } from "../entities/employee.entity";
import { Attendance } from "../entities/attendance.entity";
import { Payroll } from "../entities/payroll.entity";
import {
  CreateEmployeeDto,
  ListEmployeesQuery,
  UpdateEmployeeDto,
} from "./dto/employee.dto";

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee) private employees: Repository<Employee>,
    @InjectRepository(Attendance) private attendance: Repository<Attendance>,
    @InjectRepository(Payroll) private payroll: Repository<Payroll>,
  ) {}

  async list(query: ListEmployeesQuery) {
    const page = query.page ?? 1;
    const size = query.page_size ?? 20;
    const qb = this.employees
      .createQueryBuilder("e")
      .leftJoinAndSelect("e.department", "department")
      .leftJoinAndSelect("e.position", "position")
      .orderBy("e.emp_code", "ASC");

    if (query.q) {
      const like = `%${query.q}%`;
      qb.andWhere(
        new Brackets((qb1) => {
          qb1
            .where("e.full_name ILIKE :q", { q: like })
            .orWhere("e.emp_code ILIKE :q", { q: like })
            .orWhere("e.email ILIKE :q", { q: like });
        }),
      );
    }
    if (query.dept_id) {
      qb.andWhere("e.dept_id = :d", { d: query.dept_id });
    }

    const [items, total] = await qb
      .skip((page - 1) * size)
      .take(size)
      .getManyAndCount();

    return { items, total, page, page_size: size };
  }

  async findOne(id: number) {
    const emp = await this.employees.findOne({
      where: { emp_id: id },
      relations: ["department", "position"],
    });
    if (!emp) throw new NotFoundException("Không tìm thấy nhân viên");
    return emp;
  }

  async create(dto: CreateEmployeeDto) {
    if (new Date(dto.join_date) > new Date()) {
      throw new BadRequestException(
        "Ngày vào làm không được lớn hơn ngày hiện tại",
      );
    }
    // BUG-02 (TC-13): KHÔNG kiểm tra email trùng - giữ theo báo cáo.
    // const exists = await this.employees.findOne({ where: { email: dto.email } });
    // if (exists) throw new BadRequestException("Email đã tồn tại");

    // Sinh emp_code tự động
    const last = await this.employees
      .createQueryBuilder("e")
      .orderBy("e.emp_id", "DESC")
      .getOne();
    const nextNo = (last?.emp_id ?? 0) + 1;
    const emp_code = `NV${String(nextNo).padStart(3, "0")}`;

    const emp = this.employees.create({
      ...dto,
      emp_code,
      leaves_remaining: dto.leaves_remaining ?? 12,
      status: "active",
    });
    return this.employees.save(emp);
  }

  async update(id: number, dto: UpdateEmployeeDto) {
    const emp = await this.findOne(id);
    if (new Date(dto.join_date) > new Date()) {
      throw new BadRequestException(
        "Ngày vào làm không được lớn hơn ngày hiện tại",
      );
    }
    Object.assign(emp, dto);
    return this.employees.save(emp);
  }

  async remove(id: number) {
    const emp = await this.findOne(id);
    // BR-02: không xóa nếu đã có chấm công/lương → đánh dấu nghỉ việc
    const hasAttendance = await this.attendance.count({ where: { emp_id: id } });
    const hasPayroll = await this.payroll.count({ where: { emp_id: id } });
    if (hasAttendance + hasPayroll > 0) {
      emp.status = "resigned";
      await this.employees.save(emp);
      return { soft_deleted: true };
    }
    await this.employees.delete(id);
    return { soft_deleted: false };
  }

  async assertCanView(employeeId: number, user: any) {
    if (user.role === "EMPLOYEE" && user.employee_id !== employeeId) {
      throw new ForbiddenException("Không có quyền xem hồ sơ này");
    }
  }
}
