# HRMS Unit Test Report

## Tổng quan
- **Tổng số test case**: 46 (TC-01 → TC-46)
- **Unit test (tự động)**: 41 test case (TC-01 → TC-41)
- **GUI test (thủ công)**: 5 test case (TC-42 → TC-46) — ngoài phạm vi unit test

## File test

| File | Chức năng (FR) | Test case |
|---|---|---|
| `src/auth/auth.service.spec.ts` | FR-01 – Đăng nhập | TC-01 → TC-09 |
| `src/employees/employees.service.spec.ts` | FR-02 – Quản lý nhân viên | TC-10 → TC-17 |
| `src/attendance/attendance.service.spec.ts` | FR-03 – Chấm công | TC-18 → TC-20 |
| `src/payroll/payroll.service.spec.ts` | FR-04 – Tính lương | TC-21 → TC-31 |
| `src/leaves/leaves.service.spec.ts` | FR-05 – Nghỉ phép | TC-32 → TC-38 |
| `src/leaves/leaves-approve.spec.ts` | FR-06 – Phê duyệt nghỉ phép | TC-39 → TC-41 |

## Kết quả
- **Tests pass**: 50 / 50 (bao gồm 41 TC + 9 test phụ trợ cho edge case)
- **Tỷ lệ**: 100%

## Bug đã phát hiện (4 bugs)
| Bug | Mô tả | File ảnh hưởng |
|---|---|---|
| BUG-01 | `validateUsername` không chặn username > 20 ký tự | `auth/auth.service.ts` |
| BUG-02 | `validateEmployeeData` không kiểm tra email trùng | `employees/employees.service.ts` |
| BUG-03 | `calculate` cho NC > 26 vẫn tính lương thay vì trả về -1 | `payroll/payroll.service.ts` |
| BUG-04 | `validateRequest` dùng `>=` thay vì `>` nên từ chối đơn 12/12 ngày | `leaves/leaves.service.ts` |

## GUI Tests (TC-42 → TC-46) — Kiểm thử thủ công

Các test case sau là kiểm thử giao diện người dùng (GUI), cần thao tác thủ công trên frontend, không thể tự động hoá bằng unit test:

### TC-42: Đăng nhập thành công (GUI)
1. Mở trình duyệt, vào trang đăng nhập.
2. Nhập username/password hợp lệ.
3. Nhấn "Đăng nhập".
4. **Kỳ vọng**: Chuyển đến trang chủ, hiển thị tên người dùng.

### TC-43: Đăng nhập thất bại (GUI)
1. Nhập sai mật khẩu.
2. Nhấn "Đăng nhập".
3. **Kỳ vọng**: Hiển thị thông báo lỗi "Sai tài khoản hoặc mật khẩu".

### TC-44: Xem bảng lương (GUI)
1. Đăng nhập thành công.
2. Vào menu "Bảng lương".
3. Chọn kỳ lương.
4. **Kỳ vọng**: Hiển thị bảng lương đúng dữ liệu.

### TC-45: Tạo đơn nghỉ phép (GUI)
1. Đăng nhập.
2. Vào menu "Nghỉ phép".
3. Nhập thông tin đơn nghỉ.
4. **Kỳ vọng**: Đơn được gửi, hiển thị trong danh sách "Chờ duyệt".

### TC-46: Phê duyệt đơn nghỉ (GUI)
1. Đăng nhập tài khoản HR/Admin.
2. Vào "Phê duyệt nghỉ phép".
3. Duyệt/Từ chối đơn.
4. **Kỳ vọng**: Trạng thái đơn thay đổi, số phép còn lại cập nhật (nếu duyệt).