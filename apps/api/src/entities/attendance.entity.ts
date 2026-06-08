import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Employee } from "./employee.entity";

@Entity("attendance")
@Unique("uix_emp_date", ["emp_id", "work_date"])
export class Attendance {
  @PrimaryGeneratedColumn({ name: "att_id" })
  att_id!: number;

  @Column({ name: "emp_id" })
  emp_id!: number;

  @Column({ name: "work_date", type: "date" })
  work_date!: string;

  @Column({ name: "check_in", type: "time", nullable: true })
  check_in!: string | null;

  @Column({ name: "check_out", type: "time", nullable: true })
  check_out!: string | null;

  @Column({ name: "work_hours", type: "double precision", default: 0 })
  work_hours!: number;

  @ManyToOne(() => Employee, { eager: true })
  @JoinColumn({ name: "emp_id" })
  employee?: Employee;
}
