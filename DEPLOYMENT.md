# 🚀 Deploy Production — HRMS

Stack: **pnpm + Turbo monorepo** → `apps/api` (NestJS) + `apps/web` (Next.js) + Postgres.
Hạ tầng: **1 VPS** `42.96.18.126`, Docker Compose, **Caddy** tự động HTTPS.
CI/CD: GitHub Actions build image → đẩy **GHCR** → SSH vào VPS `pull` & `up`.

| Thành phần | Domain | Container | Cổng nội bộ |
|---|---|---|---|
| Frontend | `hrwebsite.airquality.info.vn` | `web` | 3000 |
| Backend  | `api.hrwebsite.airquality.info.vn` | `api` | 4000 |
| Database | (nội bộ) | `postgres` | 5432 |
| Proxy/SSL | 80 + 443 | `caddy` | — |

---

## 1. Chuẩn bị VPS (làm 1 lần)

```bash
ssh root@42.96.18.126

# Docker + compose plugin (nếu chưa có)
docker --version && docker compose version

# Thư mục deploy
mkdir -p /opt/hrms

# Mở firewall 80/443 (nếu dùng ufw)
ufw allow 80 && ufw allow 443
```

> Đảm bảo **không** có Nginx/Apache nào đang chiếm cổng 80/443: `ss -tlnp | grep -E ':80|:443'`.

---

## 2. Tạo SSH key cho GitHub Actions (trên máy bạn)

```bash
ssh-keygen -t ed25519 -C "gh-actions-hrms" -f ./hrms_deploy -N ""
# Thêm public key vào VPS:
ssh-copy-id -i ./hrms_deploy.pub root@42.96.18.126
# Lấy PRIVATE key để dán vào secret SSH_PRIVATE_KEY:
cat ./hrms_deploy
```

---

## 3. GitHub Secrets — Environment **production**

`Settings → Environments → production → Add environment secret`:

| Secret | Giá trị | Ghi chú |
|---|---|---|
| `SSH_HOST` | `42.96.18.126` | |
| `SSH_USER` | `root` (hoặc user của bạn) | |
| `SSH_PRIVATE_KEY` | nội dung file `hrms_deploy` | cả dòng `BEGIN/END` |
| `SSH_PORT` | `22` | tuỳ chọn |
| `POSTGRES_USER` | `hrms` | |
| `POSTGRES_PASSWORD` | mật khẩu mạnh | `openssl rand -hex 16` |
| `POSTGRES_DB` | `hrms` | |
| `JWT_SECRET` | ≥32 ký tự | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | `8h` | tuỳ chọn |

> `GITHUB_TOKEN` đã có sẵn — dùng để push & pull image GHCR, **không cần** tạo thêm.
> Domain / CORS / `NEXT_PUBLIC_API_URL` đã hardcode trong workflow & compose (không phải secret).

---

## 4. Deploy

- **Tự động:** mỗi lần `push` lên `main`.
- **Thủ công:** tab **Actions → Deploy Production → Run workflow**.

Luồng: build 2 image → push GHCR (`:latest` + `:<git-sha>`) → scp `docker-compose.prod.yml` + `Caddyfile` lên `/opt/hrms` → tạo `.env` từ secrets → `docker compose pull && up -d`.

---

## 5. Khởi tạo dữ liệu lần đầu (⚠️ xoá sạch DB)

`synchronize:true` của TypeORM tự tạo bảng khi api khởi động. Để tạo tài khoản admin + dữ liệu mẫu, chạy **1 lần**:

**Actions → Seed Production DB → Run workflow → gõ `WIPE`.**

> `seed.ts` có `dropSchema:true` nên KHÔNG bao giờ chạy tự động — chỉ chạy tay khi cố ý reset.

---

## 6. Kiểm tra & vận hành

```bash
ssh root@42.96.18.126
cd /opt/hrms
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f caddy   # xem việc cấp SSL

curl -I https://hrwebsite.airquality.info.vn
curl    https://api.hrwebsite.airquality.info.vn/health    # {"status":"ok",...}
```

**Rollback** về 1 phiên bản cũ:
```bash
cd /opt/hrms
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=<git-sha-cũ>/' .env
docker compose -f docker-compose.prod.yml up -d
```

---

## Ghi chú kỹ thuật

- **`NEXT_PUBLIC_API_URL` nhúng lúc build** → đổi domain backend phải build lại image web.
- Chưa commit `pnpm-lock.yaml` → build dùng `--no-frozen-lockfile` (không reproducible).
  Nên `pnpm install` ở local rồi commit lockfile để build ổn định hơn.
- Postgres lưu ở volume `postgres-data`, không expose ra ngoài Internet.
- Dockerfile dev cũ (`apps/*/Dockerfile`) vẫn giữ cho `docker compose up` local; production dùng `*.Dockerfile.prod`.
