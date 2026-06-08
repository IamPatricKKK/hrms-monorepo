import { Controller, Get, Injectable, Module } from "@nestjs/common";
import { TypeOrmModule, InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Department } from "../entities/department.entity";
import { Employee } from "../entities/employee.entity";
import { Leave } from "../entities/leave.entity";
import { Attendance } from "../entities/attendance.entity";

@Injectable()
class DashboardService {
  constructor(
    @InjectRepository(Employee) private employees: Repository<Employee>,
    @InjectRepository(Department) private departments: Repository<Department>,
    @InjectRepository(Leave) private leaves: Repository<Leave>,
    @InjectRepository(Attendance) private attendance: Repository<Attendance>,
  ) {}

  async stats() {
    const today = new Date().toISOString().slice(0, 10);
    const [
      total_employees,
      total_departments,
      pending_leaves,
      attendance_today,
    ] = await Promise.all([
      this.employees.count({ where: { status: "active" } }),
      this.departments.count(),
      this.leaves.count({ where: { status: "pending" } }),
      this.attendance.count({ where: { work_date: today } }),
    ]);

    const distribution = await this.departments
      .createQueryBuilder("d")
      .leftJoin("d.employees", "e")
      .select(["d.dept_name AS dept_name", "COUNT(e.emp_id) AS count"])
      .groupBy("d.dept_id")
      .orderBy("d.dept_name", "ASC")
      .getRawMany();

    const recent_leaves = await this.leaves.find({
      order: { created_at: "DESC" },
      take: 5,
      relations: ["employee"],
    });

    return {
      total_employees,
      total_departments,
      pending_leaves,
      attendance_today,
      dept_distribution: distribution.map((d) => ({
        dept_name: d.dept_name,
        count: Number(d.count),
      })),
      recent_leaves,
    };
  }
}

@Controller("dashboard")
class DashboardController {
  constructor(private service: DashboardService) {}
  @Get() stats() { return this.service.stats(); }
}

@Module({
  imports: [TypeOrmModule.forFeature([Department, Employee, Leave, Attendance])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
