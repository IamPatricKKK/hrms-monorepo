/** Công chuẩn 26 ngày/tháng (BR-07). */
export const WORK_STANDARD = 26;

/** Số ngày phép tối đa trong năm (BR-04). */
export const MAX_LEAVES_PER_YEAR = 12;

/** Số lần đăng nhập sai trước khi tạm khóa (FR-01 A3). */
export const LOGIN_LOCK_AFTER_FAILS = 5;

/** Phút tạm khóa khi sai vượt ngưỡng. */
export const LOGIN_LOCK_MINUTES = 15;

/** Username regex (4-20 ký tự, chỉ chữ và số) - FR-01 BR. */
export const USERNAME_REGEX = /^[A-Za-z0-9]{4,20}$/;

/** Password phải có cả chữ và số, tối thiểu 8 ký tự. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_HAS_LETTER = /[A-Za-z]/;
export const PASSWORD_HAS_DIGIT = /\d/;

/** Email & phone validation (BR-01). */
export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
export const PHONE_REGEX = /^\d{10}$/;
