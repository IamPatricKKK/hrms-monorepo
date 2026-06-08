import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "./employee.entity";

@Entity("departments")
export class Department {
  @PrimaryGeneratedColumn({ name: "dept_id" })
  dept_id!: number;

  @Column({ name: "dept_name", length: 100, unique: true })
  dept_name!: string;

  @OneToMany(() => Employee, (e) => e.department)
  employees?: Employee[];
}
