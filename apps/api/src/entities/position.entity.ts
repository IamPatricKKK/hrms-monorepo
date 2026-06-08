import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "./employee.entity";

@Entity("positions")
export class Position {
  @PrimaryGeneratedColumn({ name: "position_id" })
  position_id!: number;

  @Column({ name: "position_name", length: 100, unique: true })
  position_name!: string;

  @OneToMany(() => Employee, (e) => e.position)
  employees?: Employee[];
}
