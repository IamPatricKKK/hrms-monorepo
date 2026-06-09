import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';

jest.mock('bcrypt');
const mockedCompare = bcrypt.compare as jest.Mock;

/**
 * FR-01 – Đăng nhập (TC-01 → TC-09)
 * Mock repository User (findOne, save) và JwtService.
 */
describe('AuthService (FR-01 Đăng nhập)', () => {
  let service: AuthService;

  const mockUserRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('fake.jwt.token'),
  };

  // Người dùng admin hợp lệ dùng cho login() thành công.
  const activeAdmin: Partial<User> = {
    user_id: 1,
    username: 'admin',
    password_hash: '$2b$10$hashedAdmin123',
    role: 'ADMIN',
    status: 'active',
    employee_id: null,
    failed_logins: 0,
    locked_until: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('TC-01: admin/Admin123 đúng -> đăng nhập thành công, trả access_token + role', async () => {
    mockUserRepo.findOne.mockResolvedValue({ ...activeAdmin });
    mockUserRepo.save.mockImplementation(async (u) => u);
    mockedCompare.mockResolvedValue(true);

    const result = await service.login('admin', 'Admin123');

    expect(result.access_token).toBe('fake.jwt.token');
    expect(result.user.role).toBe('ADMIN');
    expect(result.user.username).toBe('admin');
    expect(mockJwtService.signAsync).toHaveBeenCalled();
  });

  it('TC-02: username 3 ký tự (<4) -> lỗi "Username phải từ 4 đến 20 ký tự"', () => {
    // validateUsername là hàm thuần -> test trực tiếp.
    expect(service.validateUsername('abc')).toBe('Username phải từ 4 đến 20 ký tự');
  });

  // [BUG-01] Đặc tả yêu cầu chặn username > 20 ký tự, nhưng validateUsername hiện
  // KHÔNG kiểm tra độ dài tối đa (vế length > 20 bị bỏ), nên trả về null (chấp nhận).
  it('TC-03 [BUG-01]: username >20 ký tự -> code KHÔNG báo lỗi (hành vi lỗi)', () => {
    const longUsername = 'a'.repeat(25); // 25 ký tự, toàn chữ/số
    // Kỳ vọng đặc tả: phải báo lỗi "Username phải từ 4 đến 20 ký tự".
    // Hành vi thực tế của code: trả về null (không chặn).
    expect(service.validateUsername(longUsername)).toBeNull();
  });

  it('TC-04: username chứa ký tự đặc biệt -> lỗi "Username chỉ gồm chữ cái và chữ số"', () => {
    expect(service.validateUsername('user@!')).toBe('Username chỉ gồm chữ cái và chữ số');
  });

  it('TC-05: password <8 ký tự -> lỗi "Password tối thiểu 8 ký tự"', () => {
    expect(service.validatePassword('Ab1')).toBe('Password tối thiểu 8 ký tự');
  });

  it('TC-06: password chỉ chữ (không số) -> lỗi "Password phải gồm cả chữ và số"', () => {
    expect(service.validatePassword('abcdefgh')).toBe('Password phải gồm cả chữ và số');
  });

  it('TC-07: đúng định dạng nhưng sai mật khẩu -> UnauthorizedException "Sai tài khoản hoặc mật khẩu"', async () => {
    mockUserRepo.findOne.mockResolvedValue({ ...activeAdmin });
    mockUserRepo.save.mockImplementation(async (u) => u);
    mockedCompare.mockResolvedValue(false); // bcrypt.compare false

    await expect(service.login('admin', 'Wrong123')).rejects.toThrow(UnauthorizedException);
    await expect(service.login('admin', 'Wrong123')).rejects.toThrow(
      'Sai tài khoản hoặc mật khẩu',
    );
  });

  it('TC-08: tài khoản status="locked" -> UnauthorizedException "Tài khoản đã bị khóa"', async () => {
    mockUserRepo.findOne.mockResolvedValue({ ...activeAdmin, status: 'locked' });

    await expect(service.login('admin', 'Admin123')).rejects.toThrow(UnauthorizedException);
    await expect(service.login('admin', 'Admin123')).rejects.toThrow('Tài khoản đã bị khóa');
  });

  it('TC-09: username/password để trống -> BadRequestException yêu cầu nhập', async () => {
    await expect(service.login('', 'Admin123')).rejects.toThrow(BadRequestException);
    await expect(service.login('', 'Admin123')).rejects.toThrow('Vui lòng nhập tên đăng nhập');

    await expect(service.login('admin', '')).rejects.toThrow(BadRequestException);
    await expect(service.login('admin', '')).rejects.toThrow('Vui lòng nhập mật khẩu');
  });
});
