import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Leave } from "../entities/leave.entity";
import { Employee } from "../entities/employee.entity";
import { LeavesController } from "./leaves.controller";
import { LeavesService } from "./leaves.service";

@Module({
  imports: [TypeOrmModule.forFeature([Leave, Employee])],
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [LeavesService],
})
export class LeavesModule {}
