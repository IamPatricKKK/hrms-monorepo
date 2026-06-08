import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Employee } from "./employee.entity";
import { User } from "./user.entity";

@Entity("leaves")
export class Leave {
  @PrimaryGeneratedColumn({ name: "leave_id" })
  leave_id!: number;

  @Column({ name: "emp_id" })
  emp_id!: number;

  @Column({ name: "leave_type", length: 50, default: "Phép năm" })
  leave_type!: string;

  @Column({ name: "start_date", type: "date" })
  start_date!: string;

  @Column({ name: "end_date", type: "date" })
  end_date!: string;

  @Column({ name: "days_count", default: 0 })
  days_count!: number;

  @Column({ type: "text", nullable: true })
  reason!: string | null;

  @Column({ length: 20, default: "pending" })
  status!: string;

  @Column({ name: "rejection_reason", type: "text", nullable: true })
  rejection_reason!: string | null;

  @Column({ name: "approved_by", type: "int", nullable: true })
  approved_by!: number | null;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @ManyToOne(() => Employee, { eager: true })
  @JoinColumn({ name: "emp_id" })
  employee?: Employee;

  @ManyToOne(() => User)
  @JoinColumn({ name: "approved_by" })
  approver?: User;
}
