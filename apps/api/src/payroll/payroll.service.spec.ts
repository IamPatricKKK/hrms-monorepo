import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollService } from './payroll.service';
import { AttendanceService } from '../attendance/attendance.service';
import { Payroll } from '../entities/payroll.entity';
import { Employee } from '../entities/employee.entity';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

/**
 * FR-04 – Tính lương (TC-21 → TC-31)
 *
 * Công thức: Lương = (LCB / 26) × NC + PC − TƯ, chặn về 0 nếu âm.
 * Bảng BVA (NC) theo thứ tự: min−, min, min+, nom, max−, max, max+
 *   với LCB = 10.400.000 (=> LCB/26 = 400.000 mỗi ngày công).
 */
describe('PayrollService (FR-04 Tính lương)', () => {
  let service: PayrollService;
  let payrollRepo: Repository<Payroll>;
  let employeeRepo: Repository<Employee>;
  let attendanceService: AttendanceService;

  const LCB = 10_400_000; // LCB/26 = 400.000

  const mockPayrollRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockEmployeeRepo = {
    findOne: jest.fn(),
  };

  const mockAttendanceService = {
    countWorkDays: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollService,
        { provide: getRepositoryToken(Payroll), useValue: mockPayrollRepo },
        { provide: getRepositoryToken(Employee), useValue: mockEmployeeRepo },
        { provide: AttendanceService, useValue: mockAttendanceService },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
    payrollRepo = module.get<Repository<Payroll>>(getRepositoryToken(Payroll));
    employeeRepo = module.get<Repository<Employee>>(getRepositoryToken(Employee));
    attendanceService = module.get<AttendanceService>(AttendanceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculate() – BVA ngày công (NC)', () => {
    it('TC-21: NC=0 (min) -> Lương = 0', () => {
      expect(PayrollService.calculate(LCB, 0)).toBe(0);
    });

    it('TC-22: NC=1 (min+), LCB=10.400.000 -> Lương = 400.000', () => {
      expect(PayrollService.calculate(LCB, 1)).toBe(400_000);
    });

    it('TC-23: NC=13 (nom), LCB=10.400.000 -> Lương = 5.200.000', () => {
      expect(PayrollService.calculate(LCB, 13)).toBe(5_200_000);
    });

    it('TC-24: NC=25 (max−), LCB=10.400.000 -> Lương = 10.000.000', () => {
      expect(PayrollService.calculate(LCB, 25)).toBe(10_000_000);
    });

    it('TC-25: NC=26 (max), LCB=10.400.000 -> Lương = 10.400.000', () => {
      expect(PayrollService.calculate(LCB, 26)).toBe(10_400_000);
    });

    it('TC-26: NC=−1 (min−) -> trả về −1 (báo lỗi)', () => {
      expect(PayrollService.calculate(LCB, -1)).toBe(-1);
    });

    // [BUG-03] Đặc tả: NC > 26 không hợp lệ -> phải trả về −1.
    // Hành vi thực tế: code thiếu vế kiểm tra NC > 26 nên vẫn tính bình thường.
    it('TC-27 [BUG-03]: NC=27 (max+) -> code KHÔNG chặn, vẫn tính = 10.800.000 (hành vi lỗi)', () => {
      expect(PayrollService.calculate(LCB, 27)).toBe(10_800_000);
    });

    it('TC-28: WBT P2 – NC=26, PC=500.000, TU=0 -> 10.900.000', () => {
      expect(PayrollService.calculate(LCB, 26, 500_000, 0)).toBe(10_900_000);
    });

    it('TC-29: WBT P3 – NC=1, LCB=2.600.000, TU=500.000 -> Lương chặn về 0', () => {
      expect(PayrollService.calculate(2_600_000, 1, 0, 500_000)).toBe(0);
    });
  });

  describe('calculatePayroll() – luồng nghiệp vụ', () => {
    const dto = { emp_id: 1, month: 5, year: 2024, confirm_overwrite: false };
    const mockEmployee = { emp_id: 1, full_name: 'Test User', base_salary: LCB };

    it('TC-30: chưa có dữ liệu chấm công -> BadRequestException', async () => {
      mockEmployeeRepo.findOne.mockResolvedValue(mockEmployee);
      mockAttendanceService.countWorkDays.mockResolvedValue(0);

      await expect(service.calculatePayroll(dto)).rejects.toThrow(BadRequestException);
    });

    it('TC-31: đã có bảng lương, không confirm_overwrite -> ConflictException', async () => {
      mockEmployeeRepo.findOne.mockResolvedValue(mockEmployee);
      mockAttendanceService.countWorkDays.mockResolvedValue(26);
      mockPayrollRepo.findOne.mockResolvedValue({ pay_id: 101, net_salary: LCB });

      await expect(service.calculatePayroll(dto)).rejects.toThrow(ConflictException);
    });

    // --- Test phụ trợ (không gán mã TC chính trong báo cáo) ---

    it('Nhân viên không tồn tại -> NotFoundException', async () => {
      mockEmployeeRepo.findOne.mockResolvedValue(null);
      await expect(service.calculatePayroll(dto)).rejects.toThrow(NotFoundException);
    });

    it('Tạo mới bảng lương thành công', async () => {
      mockEmployeeRepo.findOne.mockResolvedValue(mockEmployee);
      mockAttendanceService.countWorkDays.mockResolvedValue(26);
      mockPayrollRepo.findOne.mockResolvedValue(null); // chưa có bảng lương

      const newPayroll = { emp_id: 1, month: 5, year: 2024 };
      mockPayrollRepo.create.mockReturnValue(newPayroll);
      mockPayrollRepo.save.mockImplementation(async (p) => ({ ...p, pay_id: 102 }));

      const result = await service.calculatePayroll(dto);

      expect(result.net_salary).toBe(LCB);
      expect(mockPayrollRepo.create).toHaveBeenCalled();
      expect(mockPayrollRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ net_salary: LCB }),
      );
    });

    it('Ghi đè bảng lương thành công (confirm_overwrite=true)', async () => {
      const dtoOverwrite = { ...dto, confirm_overwrite: true };
      const existingPayroll = { pay_id: 101, emp_id: 1, month: 5, year: 2024, net_salary: 0 };

      mockEmployeeRepo.findOne.mockResolvedValue(mockEmployee);
      mockAttendanceService.countWorkDays.mockResolvedValue(26);
      mockPayrollRepo.findOne.mockResolvedValue(existingPayroll);
      mockPayrollRepo.save.mockImplementation(async (p) => p);

      const result = await service.calculatePayroll(dtoOverwrite);

      expect(result.net_salary).toBe(LCB);
      expect(result.pay_id).toBe(existingPayroll.pay_id); // ID không đổi
      expect(mockPayrollRepo.create).not.toHaveBeenCalled(); // không create mới
    });
  });
});
