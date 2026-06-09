"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHONE_REGEX = exports.EMAIL_REGEX = exports.PASSWORD_HAS_DIGIT = exports.PASSWORD_HAS_LETTER = exports.PASSWORD_MIN_LENGTH = exports.USERNAME_REGEX = exports.LOGIN_LOCK_MINUTES = exports.LOGIN_LOCK_AFTER_FAILS = exports.MAX_LEAVES_PER_YEAR = exports.WORK_STANDARD = void 0;
/** Công chuẩn 26 ngày/tháng (BR-07). */
exports.WORK_STANDARD = 26;
/** Số ngày phép tối đa trong năm (BR-04). */
exports.MAX_LEAVES_PER_YEAR = 12;
/** Số lần đăng nhập sai trước khi tạm khóa (FR-01 A3). */
exports.LOGIN_LOCK_AFTER_FAILS = 5;
/** Phút tạm khóa khi sai vượt ngưỡng. */
exports.LOGIN_LOCK_MINUTES = 15;
/** Username regex (4-20 ký tự, chỉ chữ và số) - FR-01 BR. */
exports.USERNAME_REGEX = /^[A-Za-z0-9]{4,20}$/;
/** Password phải có cả chữ và số, tối thiểu 8 ký tự. */
exports.PASSWORD_MIN_LENGTH = 8;
exports.PASSWORD_HAS_LETTER = /[A-Za-z]/;
exports.PASSWORD_HAS_DIGIT = /\d/;
/** Email & phone validation (BR-01). */
exports.EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
exports.PHONE_REGEX = /^\d{10}$/;
