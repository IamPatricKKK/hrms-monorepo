import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollService } from './payroll.service';
import { AttendanceService } from '../attendance/attendance.service';
import { Payroll } from '../entities/payroll.entity';
import { Employee } from '../entities/employee.entity';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('PayrollService', () => {
  let service: PayrollService;
  let payrollRepo: Repository<Payroll>;
  let employeeRepo: Repository<Employee>;
  let attendanceService: AttendanceService;

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
        {
          provide: getRepositoryToken(Payroll),
          useValue: mockPayrollRepo,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: mockEmployeeRepo,
        },
        {
          provide: AttendanceService,
          useValue: mockAttendanceService,
        },
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

  describe('calculate (static)', () => {
    it('TC-21: NC=-1 (ngày công âm) -> Lương = -1', () => {
      expect(PayrollService.calculate(10000000, -1)).toBe(-1);
    });

    it('TC-22: NC=0 -> Lương = 0', () => {
      expect(PayrollService.calculate(10000000, 0)).toBe(0);
    });

    it('TC-23: NC=1, LCB=5.2tr -> Lương = 200.000', () => {
      expect(PayrollService.calculate(5200000, 1)).toBe(200000);
    });

    it('TC-24: NC=25, LCB=5.2tr -> Lương = 5.000.000', () => {
      expect(PayrollService.calculate(5200000, 25)).toBe(5000000);
    });

    it('TC-25: NC=26, LCB=10.4tr -> Lương = 10.400.000', () => {
      expect(PayrollService.calculate(10400000, 26)).toBe(10400000);
    });

    it('TC-26: NC=26, LCB=10.4tr, PC=500k, TU=1tr -> Lương = 9.900.000', () => {
      expect(PayrollService.calculate(10400000, 26, 500000, 1000000)).toBe(9900000);
    });

    // [BUG-03] code hiện không chặn NC > 26, vẫn tính lương bình thường.
    // Kỳ vọng đặc tả: phải trả về lỗi hoặc giá trị -1.
    it('TC-27: NC=27 (quá chuẩn) -> Lương vẫn tính (hành vi lỗi)', () => {
      expect(PayrollService.calculate(10400000, 27)).toBe(10800000);
    });

    it('TC-28: Lương < 0 (do tạm ứng) -> Lương = 0', () => {
      expect(PayrollService.calculate(5200000, 26, 0, 6000000)).toBe(0);
    });
  });

  describe('calculatePayroll (service method)', () => {
    const dto = { emp_id: 1, month: 5, year: 2024, confirm_overwrite: false };
    const mockEmployee = { emp_id: 1, full_name: 'Test User', base_salary: 5200000 };

    it('TC-29: Nhân viên không tồn tại -> NotFoundException', async () => {
      mockEmployeeRepo.findOne.mockResolvedValue(null);
      await expect(service.calculatePayroll(dto)).rejects.toThrow(NotFoundException);
    });

    it('TC-30: Chưa có chấm công -> BadRequestException', async () => {
      mockEmployeeRepo.findOne.mockResolvedValue(mockEmployee);
      mockAttendanceService.countWorkDays.mockResolvedValue(0);
      await expect(service.calculatePayroll(dto)).rejects.toThrow(BadRequestException);
    });

    it('TC-31: Đã có bảng lương, không có confirm_overwrite -> ConflictException', async () => {
        mockEmployeeRepo.findOne.mockResolvedValue(mockEmployee);
        mockAttendanceService.countWorkDays.mockResolvedValue(25);
        const existingPayroll = { pay_id: 101, net_salary: 5000000 };
        mockPayrollRepo.findOne.mockResolvedValue(existingPayroll);
  
        const expectedError = new ConflictException({
            message: "Đã tồn tại bảng lương kỳ này. Xác nhận tính lại?",
            existing_id: existingPayroll.pay_id,
            existing_net_salary: existingPayroll.net_salary,
        });
  
        await expect(service.calculatePayroll(dto)).rejects.toThrow(expectedError);
    });

    it('Tính và tạo mới bảng lương thành công', async () => {
      mockEmployeeRepo.findOne.mockResolvedValue(mockEmployee);
      mockAttendanceService.countWorkDays.mockResolvedValue(25);
      mockPayrollRepo.findOne.mockResolvedValue(null); // Chưa có bảng lương
      
      const salary = 5000000;
      const newPayroll = { emp_id: 1, month: 5, year: 2024, net_salary: salary };
      mockPayrollRepo.create.mockReturnValue(newPayroll);
      mockPayrollRepo.save.mockResolvedValue({ ...newPayroll, pay_id: 102 });

      const result = await service.calculatePayroll(dto);
      
      expect(result.net_salary).toBe(salary);
      expect(mockPayrollRepo.create).toHaveBeenCalled();
      expect(mockPayrollRepo.save).toHaveBeenCalledWith(expect.objectContaining({ net_salary: salary }));
    });

    it('Tính và ghi đè bảng lương thành công (confirm_overwrite=true)', async () => {
        const dtoOverwrite = { ...dto, confirm_overwrite: true };
        const existingPayroll = { pay_id: 101, emp_id: 1, month: 5, year: 2024, net_salary: 4800000 };
        
        mockEmployeeRepo.findOne.mockResolvedValue(mockEmployee);
        mockAttendanceService.countWorkDays.mockResolvedValue(26); // Giả sử NC thay đổi
        mockPayrollRepo.findOne.mockResolvedValue(existingPayroll);
        
        const newSalary = 5200000;
        // Giả lập save trả về payroll đã được cập nhật
        mockPayrollRepo.save.mockResolvedValue({ ...existingPayroll, net_salary: newSalary, work_days: 26 });

        const result = await service.calculatePayroll(dtoOverwrite);
        
        expect(result.net_salary).toBe(newSalary);
        expect(result.pay_id).toBe(existingPayroll.pay_id); // ID không đổi
        expect(mockPayrollRepo.create).not.toHaveBeenCalled(); // Không create mới
        expect(mockPayrollRepo.save).toHaveBeenCalledWith(expect.objectContaining({ pay_id: existingPayroll.pay_id, net_salary: newSalary }));
    });
  });
});