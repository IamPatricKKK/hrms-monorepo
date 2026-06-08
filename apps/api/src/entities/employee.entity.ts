import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Department } from "./department.entity";
import { Position } from "./position.entity";
import { User } from "./user.entity";

@Entity("employees")
export class Employee {
  @PrimaryGeneratedColumn({ name: "emp_id" })
  emp_id!: number;

  @Column({ name: "emp_code", length: 20, unique: true })
  emp_code!: string;

  @Column({ name: "full_name", length: 100 })
  full_name!: string;

  @Column({ name: "dob", type: "date", nullable: true })
  dob!: string | null;

  @Column({ name: "gender", type: "varchar", length: 10, nullable: true })
  gender!: string | null;

  // Lưu ý: KHÔNG đánh dấu unique để giữ BUG-02 theo báo cáo
  @Column({ name: "email", length: 100 })
  email!: string;

  @Column({ name: "phone", type: "varchar", length: 15, nullable: true })
  phone!: string | null;

  @Column({ name: "dept_id", type: "int", nullable: true })
  dept_id!: number | null;

  @Column({ name: "position_id", type: "int", nullable: true })
  position_id!: number | null;

  @Column({ name: "base_salary", type: "double precision", default: 0 })
  base_salary!: number;

  @Column({ name: "join_date", type: "date", nullable: true })
  join_date!: string | null;

  @Column({ name: "leaves_remaining", default: 12 })
  leaves_remaining!: number;

  @Column({ name: "status", length: 20, default: "active" })
  status!: string;

  @ManyToOne(() => Department, (d) => d.employees, { eager: true })
  @JoinColumn({ name: "dept_id" })
  department?: Department;

  @ManyToOne(() => Position, (p) => p.employees, { eager: true })
  @JoinColumn({ name: "position_id" })
  position?: Position;

  @OneToOne(() => User, (u) => u.employee)
  user?: User;
}
