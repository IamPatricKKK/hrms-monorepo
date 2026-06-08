import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Employee } from "./employee.entity";

@Entity("payroll")
@Unique("uix_emp_month_year", ["emp_id", "month", "year"])
export class Payroll {
  @PrimaryGeneratedColumn({ name: "pay_id" })
  pay_id!: number;

  @Column({ name: "emp_id" })
  emp_id!: number;

  @Column()
  month!: number;

  @Column()
  year!: number;

  @Column({ name: "work_days", default: 0 })
  work_days!: number;

  @Column({ name: "base_salary", type: "double precision", default: 0 })
  base_salary!: number;

  @Column({ type: "double precision", default: 0 })
  allowance!: number;

  @Column({ type: "double precision", default: 0 })
  advance!: number;

  @Column({ name: "net_salary", type: "double precision", default: 0 })
  net_salary!: number;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @ManyToOne(() => Employee, { eager: true })
  @JoinColumn({ name: "emp_id" })
  employee?: Employee;
}
