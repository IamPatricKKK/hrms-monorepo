# HRMS Monorepo — Hệ thống Quản lý Nhân sự

Sản phẩm demo cho đồ án **"Kiểm thử Hệ thống Quản lý Nhân sự"** —
môn *Kiểm thử và Kiểm soát chất lượng phần mềm* (Nhóm 3 · 2025–2026).

## 1. Kiến trúc

```
hrms-monorepo/
├── apps/
│   ├── api/           NestJS + TypeORM + PostgreSQL (port 4000)
│   └── web/           Next.js 14 (App Router) + Tailwind (port 3000)
├── packages/
│   └── shared/        DTO/types/constants dùng chung
├── docker-compose.yml Postgres + API + Web (full Docker)
├── turbo.json         Turborepo orchestration
└── pnpm-workspace.yaml
```

| Lớp        | Công nghệ                              |
|------------|-----------------------------------------|
| Frontend   | Next.js 14 (App Router), Tailwind v3, shadcn-style components, Tanstack Query, Sonner |
| Backend    | NestJS 10, TypeORM, class-validator, JWT (Passport) |
| Database   | PostgreSQL 16 (Docker volume `postgres-data`) |
| Tooling    | Turborepo, pnpm workspaces, TypeScript 5 |

## 2. Chạy nhanh (Full Docker)

```bash
cd hrms-monorepo
cp .env.example .env                # tùy chỉnh nếu cần
docker compose up -d --build
# Lần đầu: chờ ~1-2 phút để build image + pnpm install + sync schema
docker compose exec api pnpm --filter @hrms/api seed   # nạp dữ liệu mẫu
```

Sau đó truy cập:

- Web: http://localhost:3000
- API: http://localhost:4000/health
- Postgres: `localhost:5432` (user/pass theo `.env`)

Theo dõi log:

```bash
docker compose logs -f api web
```

## 3. Chạy dev native (Postgres trong Docker, app native)

Nếu bạn muốn hot-reload nhanh hơn:

```bash
# 1. Chỉ chạy Postgres trong Docker
docker compose up -d postgres

# 2. Cài deps một lần (pnpm workspace)
pnpm install

# 3. Chạy cả 2 app song song qua Turborepo
pnpm dev

# Hoặc chạy riêng:
pnpm --filter @hrms/api start:dev
pnpm --filter @hrms/web dev

# Seed sau khi API đã start lần đầu (TypeORM sync schema)
pnpm seed
```

## 4. Tài khoản demo

| Username  | Mật khẩu   | Vai trò    | Ghi chú                                       |
|-----------|------------|------------|-----------------------------------------------|
| `admin`   | `Admin123` | ADMIN      | TC-01 (đăng nhập thành công)                  |
| `hr01`    | `Hr012345` | HR         | Phụ trách hồ sơ, chấm công, lương, duyệt phép |
| `nv002`   | `Nv002345` | EMPLOYEE   | Trần Văn An — đã có 20 ngày chấm công 05/2026 |
| `nv003`   | `Nv003345` | EMPLOYEE   | Phạm Thị Bình — phép còn 9 ngày               |
| `user01`  | `User1234` | EMPLOYEE   | **Đã khóa** — phục vụ TC-08                   |

## 5. Đối chiếu với báo cáo

| Chức năng | Trang web              | Module API                                |
|-----------|------------------------|-------------------------------------------|
| FR-01 Đăng nhập + phân quyền | `/login`        | `auth/auth.service.ts`                    |
| FR-02 Thêm hồ sơ NV          | `/employees/new`| `employees/employees.service.ts`          |
| FR-03 Chấm công + tổng hợp   | `/attendance`   | `attendance/attendance.service.ts`        |
| FR-04 Tính lương             | `/payroll/calculate`| `payroll/payroll.service.ts`           |
| FR-05 Gửi đơn nghỉ phép      | `/leaves/new`   | `leaves/leaves.service.ts::validateRequest`|
| FR-06 Phê duyệt đơn          | `/leaves/approve`| `leaves/leaves.controller.ts::approve`    |
| UI-01 Form hồ sơ NV          | `/employees/new`| `components/employee-form.tsx`            |

## 6. 4 BUG giữ nguyên theo báo cáo (mục 3.5)

Demo tái hiện y nguyên 4 lỗi để khớp với phần "Thực thi kiểm thử".
Mỗi vị trí có dòng comment `// BUG-XX:` — bỏ comment dòng đánh dấu là fix.

| Bug    | Test case Fail | File code                                |
|--------|----------------|------------------------------------------|
| BUG-01 | TC-03 (username 21 ký tự) | `apps/api/src/auth/auth.service.ts::validateUsername` |
| BUG-02 | TC-13 (email trùng)       | `apps/api/src/employees/employees.service.ts::create` |
| BUG-03 | TC-27 (NC = 27)           | `apps/api/src/payroll/payroll.service.ts::calculate`  |
| BUG-04 | TC-36 (nghỉ 12/12 ngày)   | `apps/api/src/leaves/leaves.service.ts::validateRequest` |

## 7. Kịch bản demo nhanh

1. Đăng nhập sai (`admin / Sai12345`) ⇒ TC-07.
2. Tài khoản bị khóa (`user01 / User1234`) ⇒ TC-08.
3. Thêm NV thiếu trường bắt buộc ⇒ TC-11..TC-17.
4. **BUG-02** — nhập email `an.nv@cty.vn` (đã có ở NV002) ⇒ TC-13 Fail.
5. Chấm công bằng tài khoản `hr01` ⇒ TC-18.
6. Tổng hợp công 05/2026 cho NV002 = 20 ngày.
7. Tính lương `nv002` 05/2026: LCB 10.4M + NC 20 + PC 500k + TƯ 0 ⇒ ~8.500.000đ.
8. **BUG-03** — chấm thêm cho 1 NV đến 27 ngày trong tháng rồi tính lương ⇒ TC-27 Fail.
9. Gửi đơn nghỉ phép `nv003` 1-3 ngày ⇒ TC-32.
10. **BUG-04** — đăng nhập `nv002` (phép còn 12), gửi đơn đúng 12 ngày ⇒ TC-36 Fail.
11. Phê duyệt nghỉ qua tài khoản `hr01` ⇒ TC-39.
12. Phân quyền: đăng nhập `nv002` rồi gõ URL `/leaves/approve` ⇒ TC-41 (chặn 403).

## 8. Lệnh hữu ích

```bash
# Reset toàn bộ DB + seed lại
docker compose exec api pnpm --filter @hrms/api seed

# Hoặc xóa volume Postgres luôn
pnpm docker:reset

# Vào shell trong container API
docker compose exec api sh

# Build production
pnpm build

# Lint cả monorepo
pnpm lint

# psql vào Postgres
docker compose exec postgres psql -U hrms -d hrms
```

## 9. Endpoints chính (API)

| Method | Path                              | Mô tả                          |
|--------|-----------------------------------|--------------------------------|
| POST   | `/api/auth/login`                | Đăng nhập, trả JWT             |
| GET    | `/api/auth/me`                   | Lấy thông tin user hiện tại    |
| GET    | `/api/dashboard`                 | Stats tổng quan                |
| GET    | `/api/employees`                 | Danh sách + filter + phân trang|
| POST   | `/api/employees`                 | Thêm hồ sơ                     |
| PATCH  | `/api/employees/:id`             | Cập nhật                       |
| DELETE | `/api/employees/:id`             | Xóa (mềm nếu có dữ liệu)       |
| GET    | `/api/attendance`                | Chấm công theo ngày            |
| POST   | `/api/attendance`                | Thêm chấm công                 |
| GET    | `/api/attendance/summary/month`  | Tổng hợp công                  |
| GET    | `/api/payroll`                   | Bảng lương theo tháng          |
| POST   | `/api/payroll/calculate`         | Tính lương (BUG-03)            |
| GET    | `/api/leaves`                    | Danh sách đơn nghỉ             |
| GET    | `/api/leaves/pending`            | Đơn chờ duyệt                  |
| POST   | `/api/leaves`                    | Gửi đơn (BUG-04)               |
| POST   | `/api/leaves/:id/approve`        | Duyệt                          |
| POST   | `/api/leaves/:id/reject`         | Từ chối                        |

## 10. Troubleshooting

- **Web báo 502/CORS** → kiểm tra biến `NEXT_PUBLIC_API_URL` trỏ đúng API.
- **API crash khi start** → kiểm tra Postgres đã `healthy` chưa (`docker compose ps`).
- **Đã chạy seed mà DB rỗng** → seed dùng `dropSchema: true` nên cần API stop hoặc rerun. Hoặc `docker compose down -v` rồi up lại.
