import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1780968631534 implements MigrationInterface {
    name = 'Init1780968631534'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "positions" ("position_id" SERIAL NOT NULL, "position_name" character varying(100) NOT NULL, CONSTRAINT "UQ_0bcff1659cc2680566a8af1675c" UNIQUE ("position_name"), CONSTRAINT "PK_a322d7b92d86d3b96777bdc310e" PRIMARY KEY ("position_id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("user_id" SERIAL NOT NULL, "username" character varying(50) NOT NULL, "password_hash" character varying(200) NOT NULL, "role" character varying(20) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'active', "employee_id" integer, "failed_logins" integer NOT NULL DEFAULT '0', "locked_until" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "REL_9760615d88ed518196bb79ea03" UNIQUE ("employee_id"), CONSTRAINT "PK_96aac72f1574b88752e9fb00089" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`CREATE TABLE "employees" ("emp_id" SERIAL NOT NULL, "emp_code" character varying(20) NOT NULL, "full_name" character varying(100) NOT NULL, "dob" date, "gender" character varying(10), "email" character varying(100) NOT NULL, "phone" character varying(15), "dept_id" integer, "position_id" integer, "base_salary" double precision NOT NULL DEFAULT '0', "join_date" date, "leaves_remaining" integer NOT NULL DEFAULT '12', "status" character varying(20) NOT NULL DEFAULT 'active', CONSTRAINT "UQ_6aa49d62bcca720302fcba850be" UNIQUE ("emp_code"), CONSTRAINT "PK_726544437a8b91e35c1734cf253" PRIMARY KEY ("emp_id"))`);
        await queryRunner.query(`CREATE TABLE "departments" ("dept_id" SERIAL NOT NULL, "dept_name" character varying(100) NOT NULL, CONSTRAINT "UQ_8a367b88085d359eb2fc3f4d2e6" UNIQUE ("dept_name"), CONSTRAINT "PK_25d6eae8829f4d135801b18d8f5" PRIMARY KEY ("dept_id"))`);
        await queryRunner.query(`CREATE TABLE "attendance" ("att_id" SERIAL NOT NULL, "emp_id" integer NOT NULL, "work_date" date NOT NULL, "check_in" TIME, "check_out" TIME, "work_hours" double precision NOT NULL DEFAULT '0', CONSTRAINT "uix_emp_date" UNIQUE ("emp_id", "work_date"), CONSTRAINT "PK_fbcbea34e6ba4ea62df8c25cdc2" PRIMARY KEY ("att_id"))`);
        await queryRunner.query(`CREATE TABLE "payroll" ("pay_id" SERIAL NOT NULL, "emp_id" integer NOT NULL, "month" integer NOT NULL, "year" integer NOT NULL, "work_days" integer NOT NULL DEFAULT '0', "base_salary" double precision NOT NULL DEFAULT '0', "allowance" double precision NOT NULL DEFAULT '0', "advance" double precision NOT NULL DEFAULT '0', "net_salary" double precision NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "uix_emp_month_year" UNIQUE ("emp_id", "month", "year"), CONSTRAINT "PK_0d96f81c6444b2b701bea1a98f3" PRIMARY KEY ("pay_id"))`);
        await queryRunner.query(`CREATE TABLE "leaves" ("leave_id" SERIAL NOT NULL, "emp_id" integer NOT NULL, "leave_type" character varying(50) NOT NULL DEFAULT 'Phép năm', "start_date" date NOT NULL, "end_date" date NOT NULL, "days_count" integer NOT NULL DEFAULT '0', "reason" text, "status" character varying(20) NOT NULL DEFAULT 'pending', "rejection_reason" text, "approved_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bd46725ac3136e212ddcea9e498" PRIMARY KEY ("leave_id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_9760615d88ed518196bb79ea03d" FOREIGN KEY ("employee_id") REFERENCES "employees"("emp_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_0f8e3929f6402bf85ba118b97c1" FOREIGN KEY ("dept_id") REFERENCES "departments"("dept_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_8b14204e8af5e371e36b8c11e1b" FOREIGN KEY ("position_id") REFERENCES "positions"("position_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_611f2e3ca1b6cc97237c09b7b74" FOREIGN KEY ("emp_id") REFERENCES "employees"("emp_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payroll" ADD CONSTRAINT "FK_709645365f94216c544e64b5da0" FOREIGN KEY ("emp_id") REFERENCES "employees"("emp_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leaves" ADD CONSTRAINT "FK_9f413f3b4c62a912b70c04590f0" FOREIGN KEY ("emp_id") REFERENCES "employees"("emp_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leaves" ADD CONSTRAINT "FK_9b68981ebf771160d0f6f78ad0f" FOREIGN KEY ("approved_by") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leaves" DROP CONSTRAINT "FK_9b68981ebf771160d0f6f78ad0f"`);
        await queryRunner.query(`ALTER TABLE "leaves" DROP CONSTRAINT "FK_9f413f3b4c62a912b70c04590f0"`);
        await queryRunner.query(`ALTER TABLE "payroll" DROP CONSTRAINT "FK_709645365f94216c544e64b5da0"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_611f2e3ca1b6cc97237c09b7b74"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_8b14204e8af5e371e36b8c11e1b"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_0f8e3929f6402bf85ba118b97c1"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_9760615d88ed518196bb79ea03d"`);
        await queryRunner.query(`DROP TABLE "leaves"`);
        await queryRunner.query(`DROP TABLE "payroll"`);
        await queryRunner.query(`DROP TABLE "attendance"`);
        await queryRunner.query(`DROP TABLE "departments"`);
        await queryRunner.query(`DROP TABLE "employees"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "positions"`);
    }

}
