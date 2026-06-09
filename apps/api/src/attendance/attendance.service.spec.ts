import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceService } from './attendance.service';
import { Attendance } from '../entities/attendance.entity';
import { Employee } from '../entities/employee.entity';
import { BadRequestException } from '@nestjs/common';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceRepo: Repository<Attendance>;

  const createAttendanceQueryBuilderMock = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
  });

  const mockAttendanceRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockEmployeeRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: getRepositoryToken(Attendance), useValue: mockAttendanceRepo },
        { provide: getRepositoryToken(Employee), useValue: mockEmployeeRepo },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    attendanceRepo = module.get<Repository<Attendance>>(getRepositoryToken(Attendance));
  });

  beforeEach(() => {
    mockAttendanceRepo.createQueryBuilder.mockReturnValue(createAttendanceQueryBuilderMock());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create (chấm công)', () => {
    it('TC-18: Hợp lệ (giờ ra > giờ vào, chưa chấm)', async () => {
      const dto = { emp_id: 1, work_date: '2024-06-10', check_in: '08:00', check_out: '17:00' };
      mockAttendanceRepo.findOne.mockResolvedValue(null);
      mockAttendanceRepo.create.mockImplementation(data => data);
      mockAttendanceRepo.save.mockResolvedValue({ ...dto, att_id: 1, work_hours: 9 });

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(result.work_hours).toBe(9);
      expect(mockAttendanceRepo.save).toHaveBeenCalled();
    });

    it('TC-19: Không hợp lệ (chấm trùng ngày)', async () => {
      const dto = { emp_id: 1, work_date: '2024-06-10', check_in: '08:00', check_out: '17:00' };
      mockAttendanceRepo.findOne.mockResolvedValue({ att_id: 1 }); // Đã tồn tại

      await expect(service.create(dto)).rejects.toThrow('Ngày này đã được chấm công');
    });

    it('TC-20: Không hợp lệ (giờ ra < giờ vào)', async () => {
      const dto = { emp_id: 1, work_date: '2024-06-10', check_in: '17:00', check_out: '08:00' };
      
      await expect(service.create(dto)).rejects.toThrow('Giờ ra phải lớn hơn giờ vào');
    });
  });

  describe('countWorkDays', () => {
      it('TC-20A: Đếm số ngày công trong tháng', async () => {
          const qb = createAttendanceQueryBuilderMock();
          qb.getCount.mockResolvedValue(22);
          mockAttendanceRepo.createQueryBuilder.mockReturnValue(qb);

          const result = await service.countWorkDays(1, 6, 2024);
          expect(result).toBe(22);
      });
  });
});