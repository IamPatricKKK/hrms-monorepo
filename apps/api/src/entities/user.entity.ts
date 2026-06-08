import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Employee } from "./employee.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn({ name: "user_id" })
  user_id!: number;

  @Column({ length: 50, unique: true })
  username!: string;

  @Column({ name: "password_hash", length: 200 })
  password_hash!: string;

  @Column({ length: 20 })
  role!: string; // ADMIN | HR | EMPLOYEE

  @Column({ length: 20, default: "active" })
  status!: string; // active | locked

  @Column({ name: "employee_id", type: "int", nullable: true })
  employee_id!: number | null;

  @Column({ name: "failed_logins", default: 0 })
  failed_logins!: number;

  @Column({ name: "locked_until", type: "timestamp", nullable: true })
  locked_until!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @OneToOne(() => Employee, (e) => e.user)
  @JoinColumn({ name: "employee_id" })
  employee?: Employee;
}
