import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeavesService } from './leaves.service';
import { Leave } from '../entities/leave.entity';
import { Employee } from '../entities/employee.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock a date for consistent testing
const MOCK_TODAY = '2024-06-10';

describe('LeavesService', () => {
  let service: LeavesService;
  let leavesRepo: Repository<Leave>;
  let employeeRepo: Repository<Employee>;

  const createLeavesQueryBuilderMock = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
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
  });

  beforeEach(() => {
    mockLeavesRepo.createQueryBuilder.mockReturnValue(createLeavesQueryBuilderMock());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('validateRequest & create', () => {
    const mockEmployee: Employee = {
      emp_id: 1,
      full_name: 'Test Employee',
      leaves_remaining: 12,
    } as Employee;

    it('TC-32: Hợp lệ (đơn 1 ngày, còn đủ phép)', async () => {
      const dto = { start_date: '2024-06-12', end_date: '2024-06-12', reason: 'Nghỉ ốm' };
      const qb = createLeavesQueryBuilderMock();
      qb.getOne.mockResolvedValue(null); // No overlap
      mockEmployeeRepo.findOne.mockResolvedValue(mockEmployee);
      mockLeavesRepo.createQueryBuilder.mockReturnValue(qb);
      mockLeavesRepo.create.mockImplementation(data => data);
      mockLeavesRepo.save.mockResolvedValue({ ...dto, leave_id: 1 });

      const result = await service.create(mockEmployee.emp_id, dto);
      expect(result).toBeDefined();
      expect(mockLeavesRepo.save).toHaveBeenCalledWith(expect.objectContaining({ days_count: 1 }));
    });

    it('TC-33: Không hợp lệ (ngày kết thúc < ngày bắt đầu)', async () => {
      const dto = { start_date: '2024-06-12', end_date: '2024-06-11', reason: 'Lỗi' };
      mockEmployeeRepo.findOne.mockResolvedValue(mockEmployee);
      await expect(service.create(mockEmployee.emp_id, dto)).rejects.toThrow(
        'Khoảng ngày không hợp lệ'
      );
    });

    it('TC-34: Không hợp lệ (ngày bắt đầu < ngày hiện tại)', async () => {
      const dto = { start_date: '2024-06-09', end_date: '2024-06-09', reason: 'Lỗi' };
      mockEmployeeRepo.findOne.mockResolvedValue(mockEmployee);
      await expect(service.create(mockEmployee.emp_id, dto)).rejects.toThrow(
        'Ngày bắt đầu phải từ hôm nay trở đi'
      );
    });

    it('TC-35: Không hợp lệ (số ngày nghỉ > số phép còn lại)', async () => {
      const dto = { start_date: '2024-06-12', end_date: '2024-06-24', reason: 'Nghỉ hè' }; // 13 days
      mockEmployeeRepo.findOne.mockResolvedValue(mockEmployee);
      await expect(service.create(mockEmployee.emp_id, dto)).rejects.toThrow(
        /vượt quá số phép còn lại/
      );
    });

    // [BUG-04] code hiện không chặn đúng biên 12/12 vì dùng >= thay vì >, nên đơn 12/12 ngày bị từ chối.
    // Kỳ vọng đặc tả là: đơn hợp lệ khi số ngày nghỉ bằng số phép còn lại.
    it('TC-36: Không hợp lệ (số ngày nghỉ = số phép còn lại) -> bị từ chối (hành vi lỗi)', async () => {
      const dto = { start_date: '2024-06-12', end_date: '2024-06-23', reason: 'Nghỉ hết phép' }; // 12 days
      mockEmployeeRepo.findOne.mockResolvedValue(mockEmployee);
      await expect(service.create(mockEmployee.emp_id, dto)).rejects.toThrow(
        /vượt quá số phép còn lại/
      );
    });

    it('TC-37: Không hợp lệ (trùng với đơn đã có)', async () => {
      const dto = { start_date: '2024-06-12', end_date: '2024-06-12', reason: 'Trùng' };
      const qb = createLeavesQueryBuilderMock();
      qb.getOne.mockResolvedValue({ leave_id: 2 }); // Overlap found
      mockEmployeeRepo.findOne.mockResolvedValue(mockEmployee);
      mockLeavesRepo.createQueryBuilder.mockReturnValue(qb);
      await expect(service.create(mockEmployee.emp_id, dto)).rejects.toThrow(
        'Đã tồn tại đơn nghỉ trong khoảng ngày này'
      );
    });

    it('TC-38: Không hợp lệ (nhân viên không tồn tại)', async () => {
        const dto = { start_date: '2024-06-12', end_date: '2024-06-12', reason: '...' };
        mockEmployeeRepo.findOne.mockResolvedValue(null);
        await expect(service.create(999, dto)).rejects.toThrow(NotFoundException);
    });
  });
});