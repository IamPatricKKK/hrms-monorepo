import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeavesService } from './leaves.service';
import { Leave } from '../entities/leave.entity';
import { Employee } from '../entities/employee.entity';
import { NotFoundException } from '@nestjs/common';

// Cố định "hôm nay" để test ổn định.
const MOCK_TODAY = '2024-06-10';

/**
 * FR-05 – Nghỉ phép (TC-32 → TC-38)
 * Nhân viên còn 12 ngày phép.
 */
describe('LeavesService (FR-05 Nghỉ phép)', () => {
  let service: LeavesService;
  let leavesRepo: Repository<Leave>;
  let employeeRepo: Repository<Employee>;

  const createLeavesQueryBuilderMock = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
  });

  const mockLeavesRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockEmployeeRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockEmployee: Employee = {
    emp_id: 1,
    full_name: 'Test Employee',
    leaves_remaining: 12,
  } as Employee;

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date(MOCK_TODAY));
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeavesService,
        { provide: getRepositoryToken(Leave), useValue: mockLeavesRepo },
        { provide: getRepositoryToken(Employee), useValue: mockEmployeeRepo },
      ],
    }).compile();

    service = module.get<LeavesService>(LeavesService);
    leavesRepo = module.get<Repository<Leave>>(getRepositoryToken(Leave));
    employeeRepo = module.get<Repository<Employee>>(getRepositoryToken(Employee));

    mockLeavesRepo.createQueryBuilder.mockReturnValue(createLeavesQueryBuilderMock());
    mockLeavesRepo.create.mockImplementation((data) => data);
    mockLeavesRepo.save.mockImplementation(async (entity) => ({ ...entity, leave_id: 1 }));
    mockEmployeeRepo.findOne.mockResolvedValue(mockEmployee);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('TC-32: đơn hợp lệ (3 ngày, đủ phép) -> tạo "Chờ duyệt"', async () => {
    const dto = { start_date: '2024-06-12', end_date: '2024-06-14', reason: 'Nghỉ việc riêng' };

    const result = await service.create(mockEmployee.emp_id, dto);

    expect(result.status).toBe('pending');
    expect(mockLeavesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ days_count: 3, status: 'pending' }),
    );
  });

  it('TC-33: ngày KT < ngày BĐ -> lỗi "Khoảng ngày không hợp lệ"', async () => {
    const dto = { start_date: '2024-06-12', end_date: '2024-06-11', reason: 'Lỗi' };
    await expect(service.create(mockEmployee.emp_id, dto)).rejects.toThrow(
      'Khoảng ngày không hợp lệ',
    );
  });

  it('TC-34: ngày BĐ < hôm nay -> lỗi "Ngày bắt đầu phải từ hôm nay trở đi"', async () => {
    const dto = { start_date: '2024-06-09', end_date: '2024-06-09', reason: 'Lỗi' };
    await expect(service.create(mockEmployee.emp_id, dto)).rejects.toThrow(
      'Ngày bắt đầu phải từ hôm nay trở đi',
    );
  });

  it('TC-35: nghỉ 13 ngày > phép còn 12 -> lỗi "vượt quá số phép còn lại"', async () => {
    const dto = { start_date: '2024-06-12', end_date: '2024-06-24', reason: 'Nghỉ hè' }; // 13 ngày
    await expect(service.create(mockEmployee.emp_id, dto)).rejects.toThrow(
      /vượt quá số phép còn lại/,
    );
  });

  // [BUG-04] Đặc tả: nghỉ đúng 12 ngày = số phép còn lại 12 -> HỢP LỆ.
  // Hành vi thực tế: code dùng `>=` nên đơn 12/12 bị từ chối nhầm.
  it('TC-36 [BUG-04]: nghỉ đúng 12 ngày = phép còn 12 -> bị từ chối (hành vi lỗi)', async () => {
    const dto = { start_date: '2024-06-12', end_date: '2024-06-23', reason: 'Nghỉ hết phép' }; // 12 ngày
    await expect(service.create(mockEmployee.emp_id, dto)).rejects.toThrow(
      /vượt quá số phép còn lại/,
    );
  });

  it('TC-37: nghỉ 1 ngày (min, BĐ=KT) -> tạo "Chờ duyệt"', async () => {
    const dto = { start_date: '2024-06-12', end_date: '2024-06-12', reason: 'Nghỉ ốm' };

    const result = await service.create(mockEmployee.emp_id, dto);

    expect(result.status).toBe('pending');
    expect(mockLeavesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ days_count: 1, status: 'pending' }),
    );
  });

  it('TC-38: trùng với đơn đã gửi -> lỗi "Đã tồn tại đơn nghỉ trong khoảng ngày này"', async () => {
    const dto = { start_date: '2024-06-12', end_date: '2024-06-12', reason: 'Trùng' };
    const qb = createLeavesQueryBuilderMock();
    qb.getOne.mockResolvedValue({ leave_id: 2 }); // tìm thấy đơn trùng
    mockLeavesRepo.createQueryBuilder.mockReturnValue(qb);

    await expect(service.create(mockEmployee.emp_id, dto)).rejects.toThrow(
      'Đã tồn tại đơn nghỉ trong khoảng ngày này',
    );
  });

  // --- Test phụ trợ (không gán mã TC chính trong báo cáo) ---
  it('Nhân viên không tồn tại -> NotFoundException', async () => {
    const dto = { start_date: '2024-06-12', end_date: '2024-06-12', reason: '...' };
    mockEmployeeRepo.findOne.mockResolvedValue(null);
    await expect(service.create(999, dto)).rejects.toThrow(NotFoundException);
  });
});
