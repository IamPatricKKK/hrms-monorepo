import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeavesService } from './leaves.service';
import { Leave } from '../entities/leave.entity';
import { Employee } from '../entities/employee.entity';
import { BadRequestException } from '@nestjs/common';

describe('LeavesService - Approve/Reject', () => {
  let service: LeavesService;
  let leavesRepo: Repository<Leave>;
  let employeeRepo: Repository<Employee>;

  const mockLeavesRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockEmployeeRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

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
    mockLeavesRepo.save.mockImplementation(async (entity) => entity);
    mockEmployeeRepo.save.mockImplementation(async (entity) => entity);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('approve', () => {
    it('TC-39: Phê duyệt thành công (trạng thái pending) -> Trừ phép', async () => {
      const mockLeave = { leave_id: 1, emp_id: 10, status: 'pending', days_count: 2 };
      const mockEmployee = { emp_id: 10, leaves_remaining: 5 };
      
      mockLeavesRepo.findOne.mockResolvedValue(mockLeave);
      mockEmployeeRepo.findOne.mockResolvedValue(mockEmployee);

      const result = await service.approve(1, 99); // approver_id = 99

      expect(result.status).toBe('approved');
      expect(result.approved_by).toBe(99);
      expect(mockLeavesRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));
      
      // Kiểm tra trừ phép
      expect(mockEmployeeRepo.save).toHaveBeenCalledWith(expect.objectContaining({ leaves_remaining: 3 }));
    });

    it('TC-40: Phê duyệt lỗi (đơn đã xử lý)', async () => {
      const mockLeave = { leave_id: 1, emp_id: 10, status: 'approved' };
      mockLeavesRepo.findOne.mockResolvedValue(mockLeave);

      await expect(service.approve(1, 99)).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('TC-41: Từ chối thành công -> Không trừ phép', async () => {
      const mockLeave = { leave_id: 1, emp_id: 10, status: 'pending', days_count: 2 };
      
      mockLeavesRepo.findOne.mockResolvedValue(mockLeave);

      const dto = { rejection_reason: 'Không đủ nhân sự' };
      const result = await service.reject(1, 99, dto);

      expect(result.status).toBe('rejected');
      expect(result.approved_by).toBe(99);
      expect(result.rejection_reason).toBe(dto.rejection_reason);
      expect(mockLeavesRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'rejected' }));
      
      // Không gọi save cho employee -> không trừ phép
      expect(mockEmployeeRepo.save).not.toHaveBeenCalled();
    });
  });
});