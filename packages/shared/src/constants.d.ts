/** Công chuẩn 26 ngày/tháng (BR-07). */
export declare const WORK_STANDARD = 26;
/** Số ngày phép tối đa trong năm (BR-04). */
export declare const MAX_LEAVES_PER_YEAR = 12;
/** Số lần đăng nhập sai trước khi tạm khóa (FR-01 A3). */
export declare const LOGIN_LOCK_AFTER_FAILS = 5;
/** Phút tạm khóa khi sai vượt ngưỡng. */
export declare const LOGIN_LOCK_MINUTES = 15;
/** Username regex (4-20 ký tự, chỉ chữ và số) - FR-01 BR. */
export declare const USERNAME_REGEX: RegExp;
/** Password phải có cả chữ và số, tối thiểu 8 ký tự. */
export declare const PASSWORD_MIN_LENGTH = 8;
export declare const PASSWORD_HAS_LETTER: RegExp;
export declare const PASSWORD_HAS_DIGIT: RegExp;
/** Email & phone validation (BR-01). */
export declare const EMAIL_REGEX: RegExp;
export declare const PHONE_REGEX: RegExp;
