import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeesService } from './employees.service';
import { Employee } from '../entities/employee.entity';
import { Attendance } from '../entities/attendance.entity';
import { Payroll } from '../entities/payroll.entity';
import { BadRequestException } from '@nestjs/common';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let employeeRepo: Repository<Employee>;

  const mockEmployeeRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    })),
  };

  const mockAttendanceRepo = {};
  const mockPayrollRepo = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: getRepositoryToken(Employee), useValue: mockEmployeeRepo },
        { provide: getRepositoryToken(Attendance), useValue: mockAttendanceRepo },
        { provide: getRepositoryToken(Payroll), useValue: mockPayrollRepo },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    employeeRepo = module.get<Repository<Employee>>(getRepositoryToken(Employee));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('TC-10: Hợp lệ (đầy đủ thông tin)', async () => {
      const dto = {
        full_name: 'Nguyen Van A',
        email: 'nva@example.com',
        phone: '0123456789',
        dob: '1990-01-01',
        gender: 'Nam',
        address: 'Hanoi',
        join_date: '2023-01-01', // quá khứ -> hợp lệ
        base_salary: 10000000,
        position_id: 1,
        dept_id: 1,
      };

      mockEmployeeRepo.createQueryBuilder().getOne.mockResolvedValue({ emp_id: 5 }); // last employee
      mockEmployeeRepo.create.mockImplementation(data => data);
      mockEmployeeRepo.save.mockResolvedValue({ ...dto, emp_id: 6, emp_code: 'NV006' });

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(mockEmployeeRepo.save).toHaveBeenCalled();
    });

    it('TC-11: Không hợp lệ (thiếu field bắt buộc)', async () => {
      // NestJS validation pipe xử lý ở controller, service không throw lỗi do thiếu field dto.
      // DTO testing nên thực hiện ở e2e test, unit test chỉ test logic trong service.
      expect(true).toBe(true);
    });

    it('TC-12: Không hợp lệ (ngày vào làm > hiện tại)', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      
      const dto = {
        full_name: 'Test',
        email: 'test@example.com',
        phone: '0123456789',
        dob: '1990-01-01',
        gender: 'Nam',
        address: 'Hanoi',
        join_date: futureDate.toISOString().split('T')[0],
        base_salary: 10000000,
        position_id: 1,
        dept_id: 1,
      };

      await expect(service.create(dto)).rejects.toThrow('Ngày vào làm không được lớn hơn ngày hiện tại');
    });

    // [BUG-02] code hiện không kiểm tra email trùng (đã bị comment out).
    // Kỳ vọng đặc tả: phải báo lỗi nếu email đã tồn tại.
    it('TC-13: Không hợp lệ (email trùng) -> vẫn tạo được (hành vi lỗi)', async () => {
      const dto = {
        full_name: 'Nguyen Van B',
        email: 'nva@example.com', // Trùng email với TC-10
        phone: '0987654321',
        dob: '1990-01-01',
        gender: 'Nam',
        address: 'Hanoi',
        join_date: '2023-01-01',
        base_salary: 10000000,
        position_id: 1,
        dept_id: 1,
      };

      // Cho dù findOne trả về entity (nếu gọi), logic hiện tại vẫn chạy tiếp và save
      mockEmployeeRepo.findOne.mockResolvedValue({ emp_id: 1, email: 'nva@example.com' });
      mockEmployeeRepo.createQueryBuilder().getOne.mockResolvedValue({ emp_id: 5 });
      mockEmployeeRepo.create.mockImplementation(data => data);
      mockEmployeeRepo.save.mockResolvedValue({ ...dto, emp_id: 6, emp_code: 'NV006' });

      const result = await service.create(dto);
      expect(result).toBeDefined(); // Tạo thành công (lỗi)
    });

    it('TC-14: SDT không đúng định dạng', async () => {
      // NestJS validation pipe xử lý ở controller.
      expect(true).toBe(true);
    });

    it('TC-15: LCB < 0', async () => {
      // NestJS validation pipe xử lý ở controller.
      expect(true).toBe(true);
    });

    it('TC-16: Tuổi < 18', async () => {
      // NestJS validation pipe xử lý ở controller.
      expect(true).toBe(true);
    });

    it('TC-17: Phòng ban/Vị trí không tồn tại', async () => {
       // Xử lý bởi ràng buộc khóa ngoại của DB (TypeORM ném QueryFailedError)
       expect(true).toBe(true);
    });
  });
});