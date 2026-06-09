# 🚀 Deploy Production — HRMS

Stack: **pnpm + Turbo monorepo** → `apps/api` (NestJS) + `apps/web` (Next.js) + Postgres.
Hạ tầng: **1 VPS** `42.96.18.126`, Docker Compose. **Dùng chung Caddy** sẵn có của
project air-quality (`airquality-caddy`, network `airquality_prod`) làm reverse proxy + HTTPS.
CI/CD: GitHub Actions build image → đẩy **GHCR** → SSH vào VPS `pull` & `up`.

| Thành phần | Domain | Container | Cổng nội bộ |
|---|---|---|---|
| Frontend | `hrwebsite.airquality.info.vn` | `hrms-web` | 3000 |
| Backend  | `api.hrwebsite.airquality.info.vn` | `hrms-api` | 4000 |
| Database | (nội bộ) | `hrms-postgres` | 5432 |
| Proxy/SSL | 80 + 443 | `airquality-caddy` (dùng chung) | — |

> ⚠️ VPS đã chạy stack **air-quality** (caddy giữ 80/443, postgres giữ host:5432).
> HRMS **KHÔNG** dựng Caddy mới và **KHÔNG** publish cổng postgres → tránh xung đột.
> HRMS chỉ thêm `hrms-api`/`hrms-web` vào network `airquality_prod` để Caddy proxy tới.

---

## 1. Chuẩn bị VPS (làm 1 lần)

```bash
ssh root@42.96.18.126
docker --version && docker compose version   # đã có sẵn
mkdir -p /opt/hrms
```

Không cần đụng firewall (80/443 đã do air-quality mở sẵn).

---

## 1b. Thêm domain HRMS vào Caddy sẵn có (làm 1 lần, SAU khi deploy lần đầu)

Mở `/opt/airquality/infra/Caddyfile`, **thêm vào cuối** 2 block (xem `deploy/caddy-hrms.snippet`):

```caddy
hrwebsite.airquality.info.vn {
	encode gzip zstd
	reverse_proxy hrms-web:3000
}
api.hrwebsite.airquality.info.vn {
	encode gzip zstd
	reverse_proxy hrms-api:4000
}
```

Rồi nạp lại Caddy (không downtime):

```bash
docker exec airquality-caddy caddy validate --config /etc/caddy/Caddyfile
docker exec airquality-caddy caddy reload   --config /etc/caddy/Caddyfile
```

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

## 4. Deploy — 5 job trong workflow "Deploy Production"

```
build-api ┐
          ├─→ deploy (web+api+db) ─────→ migrate ─→ [seed: opt-in]
build-web ┘
```

| Job | Làm gì |
|---|---|
| `build-api` / `build-web` | Build & push 2 image lên GHCR (`:latest` + `:<git-sha>`), chạy song song |
| `deploy` | scp compose → tạo `.env` từ secrets → `docker compose pull && up -d` (api/web join network `airquality_prod`) |
| `migrate` | Chạy `typeorm migration:run` (versioned, **không mất dữ liệu**) rồi xác minh `/health` |
| `seed` | ⚠️ Chỉ chạy khi tick `seed_data` lúc Run workflow — chạy migration + **TRUNCATE dữ liệu** rồi nạp lại dữ liệu mẫu |

- **Tự động:** mỗi lần `push` lên `main` → chạy `build → deploy → migrate` (KHÔNG seed).
- **Thủ công:** **Actions → Deploy Production → Run workflow**.

---

## 5. Migration & seed

**Migration (thật, versioned):** `apps/api/src/migrations/`. Schema KHÔNG còn dùng
`synchronize` — job `migrate` chạy `typeorm migration:run` mỗi lần deploy, chỉ áp
migration mới, **không mất dữ liệu**.

- Sau khi đổi/ thêm `@Entity`, tạo migration mới ở local:
  ```bash
  # cần 1 Postgres để so sánh schema
  pnpm --filter @hrms/api typeorm migration:generate src/migrations/<TênThayĐổi>
  ```
  rồi commit file migration → lần deploy sau job `migrate` tự áp.

**Seed dữ liệu mẫu (opt-in, ⚠️ xoá dữ liệu):** tạo admin + dữ liệu demo lần đầu:

**Actions → Deploy Production → Run workflow → tick `seed_data` ✅ → Run.**

> Seed chạy migration để chắc schema, rồi **TRUNCATE toàn bộ bảng** và nạp lại dữ liệu mẫu
> (giữ schema + bảng `migrations`). KHÔNG bao giờ chạy khi `push` — chỉ khi bạn chủ động tick.

---

## 6. Kiểm tra & vận hành

```bash
ssh root@42.96.18.126
cd /opt/hrms
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
docker logs -f airquality-caddy            # log Caddy dùng chung (cấp SSL)

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
