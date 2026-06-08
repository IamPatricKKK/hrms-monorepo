export enum Role {
  ADMIN = "ADMIN",
  HR = "HR",
  EMPLOYEE = "EMPLOYEE",
}

export enum UserStatus {
  ACTIVE = "active",
  LOCKED = "locked",
}

export enum EmployeeStatus {
  ACTIVE = "active",
  RESIGNED = "resigned",
}

export enum LeaveStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

// ---------- Auth ----------
export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export interface AuthUser {
  user_id: number;
  username: string;
  role: Role;
  employee_id: number | null;
  full_name: string | null;
}

// ---------- Domain DTOs ----------
export interface DepartmentDto {
  dept_id: number;
  dept_name: string;
  employee_count?: number;
}

export interface PositionDto {
  position_id: number;
  position_name: string;
  employee_count?: number;
}

export interface EmployeeDto {
  emp_id: number;
  emp_code: string;
  full_name: string;
  dob: string | null;
  gender: string | null;
  email: string;
  phone: string | null;
  dept_id: number | null;
  position_id: number | null;
  base_salary: number;
  join_date: string | null;
  leaves_remaining: number;
  status: EmployeeStatus;
  department?: DepartmentDto;
  position?: PositionDto;
}

export interface AttendanceDto {
  att_id: number;
  emp_id: number;
  work_date: string;
  check_in: string | null;
  check_out: string | null;
  work_hours: number;
  employee?: EmployeeDto;
}

export interface PayrollDto {
  pay_id: number;
  emp_id: number;
  month: number;
  year: number;
  work_days: number;
  base_salary: number;
  allowance: number;
  advance: number;
  net_salary: number;
  employee?: EmployeeDto;
}

export interface LeaveDto {
  leave_id: number;
  emp_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: LeaveStatus;
  rejection_reason: string | null;
  approved_by: number | null;
  created_at: string;
  employee?: EmployeeDto;
}

export interface UserDto {
  user_id: number;
  username: string;
  role: Role;
  status: UserStatus;
  employee_id: number | null;
  failed_logins?: number;
  locked_until?: string | null;
  employee?: EmployeeDto;
}

// ---------- Dashboard ----------
export interface DashboardStats {
  total_employees: number;
  total_departments: number;
  pending_leaves: number;
  attendance_today: number;
  dept_distribution: { dept_name: string; count: number }[];
  recent_leaves: LeaveDto[];
}
