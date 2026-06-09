import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/employee.dto';
import { Employee } from '../entities/employee.entity';
import { Attendance } from '../entities/attendance.entity';
import { Payroll } from '../entities/payroll.entity';

/**
 * FR-02 – Quản lý hồ sơ nhân viên (TC-10 → TC-17)
 * Ràng buộc dữ liệu được kiểm bằng class-validator trên CreateEmployeeDto;
 * ràng buộc nghiệp vụ (ngày vào làm) được kiểm trong service.create().
 */
describe('EmployeesService (FR-02 Hồ sơ nhân viên)', () => {
  let service: EmployeesService;
  let employeeRepo: Repository<Employee>;

  const mockEmployeeRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    })),
  };

  const mockAttendanceRepo = {};
  const mockPayrollRepo = {};

  // DTO gốc hợp lệ – các test sửa từng field để kiểm tra ràng buộc.
  const validRaw = {
    full_name: 'Nguyen Van A',
    email: 'nva@example.com',
    phone: '0123456789',
    dob: '1990-01-01',
    gender: 'Nam',
    join_date: '2023-01-01',
    base_salary: 10_000_000,
    position_id: 1,
    dept_id: 1,
  };

  /** Tiện ích: trả về danh sách property bị lỗi validate. */
  const validateDto = async (raw: any): Promise<string[]> => {
    const dto = plainToInstance(CreateEmployeeDto, raw);
    const errors = await validate(dto);
    return errors.map((e) => e.property);
  };

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

  it('TC-10: DTO đầy đủ hợp lệ -> không lỗi validate + service.create lưu thành công', async () => {
    expect(await validateDto(validRaw)).toEqual([]);

    mockEmployeeRepo.create.mockImplementation((data) => data);
    mockEmployeeRepo.save.mockResolvedValue({ ...validRaw, emp_id: 6, emp_code: 'NV006' });

    const result = await service.create(validRaw as any);
    expect(result).toBeDefined();
    expect(mockEmployeeRepo.save).toHaveBeenCalled();
  });

  it('TC-11: thiếu full_name -> lỗi field full_name', async () => {
    const { full_name, ...raw } = validRaw;
    expect(await validateDto(raw)).toContain('full_name');
  });

  it('TC-12: email sai định dạng (nv01@@ntu) -> lỗi field email', async () => {
    expect(await validateDto({ ...validRaw, email: 'nv01@@ntu' })).toContain('email');
  });

  // [BUG-02] Đặc tả: email trùng phải bị từ chối, nhưng check trùng đã bị comment
  // trong service.create nên vẫn tạo được.
  it('TC-13 [BUG-02]: email trùng -> service.create VẪN tạo được (hành vi lỗi)', async () => {
    // findOne trả về nhân viên trùng email; code không dùng kết quả này nên vẫn save.
    mockEmployeeRepo.findOne.mockResolvedValue({ emp_id: 1, email: validRaw.email });
    mockEmployeeRepo.create.mockImplementation((data) => data);
    mockEmployeeRepo.save.mockResolvedValue({ ...validRaw, emp_id: 7, emp_code: 'NV007' });

    const result = await service.create(validRaw as any);
    expect(result).toBeDefined(); // tạo thành công (hành vi lỗi)
  });

  it('TC-14: phone 9 số (090123456) -> lỗi field phone', async () => {
    expect(await validateDto({ ...validRaw, phone: '090123456' })).toContain('phone');
  });

  it('TC-15: phone chứa chữ (09012345ab) -> lỗi field phone', async () => {
    expect(await validateDto({ ...validRaw, phone: '09012345ab' })).toContain('phone');
  });

  it('TC-16: base_salary âm (-5.000.000) -> lỗi field base_salary', async () => {
    expect(await validateDto({ ...validRaw, base_salary: -5_000_000 })).toContain('base_salary');
  });

  it('TC-17: join_date tương lai -> service.create ném lỗi ngày vào làm', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    const raw = { ...validRaw, join_date: future.toISOString().split('T')[0] };

    await expect(service.create(raw as any)).rejects.toThrow(
      'Ngày vào làm không được lớn hơn ngày hiện tại',
    );
  });
});
