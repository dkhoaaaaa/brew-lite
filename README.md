# BrewLite — Nền tảng Đặt đồ uống & Bánh trực tuyến

BrewLite là ứng dụng thương mại điện tử chuyên về đồ uống và bánh ngọt, hỗ trợ tùy chỉnh size/topping, kiểm soát tồn kho nguyên liệu thời gian thực (Optimistic Locking) và tích hợp cổng thanh toán trực tuyến VNPay Sandbox.

Hệ thống được thiết kế theo kiến trúc **Monorepo** dùng chung duy nhất một mã nguồn cho cả môi trường phát triển cục bộ (**Local Development**) và môi trường phát hành (**Production Deployment**):
- **Local Development:** Khởi chạy 100% bằng **Docker Compose** kết hợp **PostgreSQL local**, không yêu cầu cài đặt Node.js hay pnpm trên máy host (hỗ trợ cả chạy trực tiếp bằng pnpm).
- **Production Deployment:** Triển khai độc lập Frontend trên **Vercel**, Backend API trên **Render**, và lưu trữ dữ liệu trên **Neon Serverless PostgreSQL**.

---

## Tiêu chí nghiệm thu & Phiên bản Production

> **Tiêu chí nghiệm thu (Acceptance Criteria):**  
> Một người không thuộc nhóm có thể **clone repository, chạy hệ thống theo README** và **truy cập phiên bản production** từ các URL được cung cấp dưới đây mà không gặp bất kỳ trở ngại nào.

### Đường dẫn Production & Thông tin phát hành

| Thành phần | Môi trường / Nền tảng | Đường dẫn truy cập (Production URLs) | Trạng thái |
|---|---|---|---|
| **Giao diện người dùng (Frontend)** | Vercel (Next.js 16) | [https://brew-lite-tau.vercel.app](https://brew-lite-tau.vercel.app) | Live |
| **Backend REST API** | Render (NestJS 12) | [https://brew-lite-backend.onrender.com](https://brew-lite-a4jv.onrender.com) | Live |
| **Kiểm tra sức khỏe (Health Check)** | Render API Endpoint | [https://brew-lite-backend.onrender.com/health](https://brew-lite-a4jv.onrender.com/health) | Live |
| **Cơ sở dữ liệu đám mây** | Neon PostgreSQL 17 | Serverless Pooled & Direct Connections | Live |
| **Phiên bản phát hành (Tag / Release)** | GitHub Releases | `v1.0.0` ([Xem Release Notes](https://github.com/dkhoaaaaa/brew-lite/releases)) | v1.0.0 |
| **Video Demo End-to-End** | Google Drive / YouTube | [Xem Video Demo](https://drive.google.com/file/d/1iHT4lmRY7KDPE1H1Fg6_ofTUbZI9RrEb/view?usp=sharing) | Sẵn sàng |

---

## Mục lục

1. [Công nghệ sử dụng](#1-công-nghệ-sử-dụng)
2. [Cấu trúc thư mục Monorepo](#2-cấu-trúc-thư-mục-monorepo)
3. [Điều kiện tiên quyết](#3-điều-kiện-tiên-quyết)
4. [Hướng dẫn Khởi chạy Local (Local Setup & Run)](#4-hướng-dẫn-khởi-chạy-local-local-setup--run)
   - [Cách 1: Khởi chạy bằng Docker Compose (Khuyên dùng)](#cách-1-khởi-chạy-bằng-docker-compose-khuyên-dùng)
   - [Cách 2: Khởi chạy trực tiếp bằng pnpm / Node.js (Không dùng Docker)](#cách-2-khởi-chạy-trực-tiếp-bằng-pnpm--nodejs-không-dùng-docker)
   - [Tùy chọn: Kết nối Neon PostgreSQL Cloud](#tùy-chọn-kết-nối-neon-postgresql-cloud)
5. [Hướng dẫn Kiểm thử tự động (Testing Guide)](#5-hướng-dẫn-kiểm-thử-tự-động-testing-guide)
6. [Hướng dẫn Đóng gói & Build (Build Guide)](#6-hướng-dẫn-đóng-gói--build-build-guide)
7. [Hướng dẫn Triển khai (Deployment Guide)](#7-hướng-dẫn-triển-khai-deployment-guide)
8. [Hướng dẫn Thu hồi & Hoàn tác (Rollback Guide)](#8-hướng-dẫn-thu-hồi--hoàn-tác-rollback-guide)
9. [Tài khoản Demo & Kịch bản kiểm thử nghiệp vụ E2E](#9-tài-khoản-demo--kịch-bản-kiểm-thử-nghiệp-vụ-e2e)
10. [Tích hợp cổng thanh toán VNPay Sandbox](#10-tích-hợp-cổng-thanh-toán-vnpay-sandbox)
11. [Quản trị Docker & Khắc phục sự cố (Troubleshooting)](#11-quản-trị-docker--khắc-phục-sự-cố-troubleshooting)

---

## 1. Công nghệ sử dụng

| Tầng kiến trúc | Công nghệ & Phiên bản | Vai trò |
|---|---|---|
| **Frontend** | Next.js 16 (React 19, Tailwind CSS v4, Turbopack) | Giao diện người dùng Mobile-first, SSR & Client State Management |
| **Backend** | NestJS 12, Express, TypeScript 6 | RESTful API, xác thực JWT, RBAC, kiểm soát tồn kho & giao dịch |
| **Cơ sở dữ liệu** | PostgreSQL 17 (Docker Local / Neon Cloud) | CSDL quan hệ lưu trữ sản phẩm, đơn hàng, người dùng, giao dịch |
| **ORM & Migrations**| Prisma 7 (`@prisma/client`, `@prisma/adapter-pg`) | Quản lý schema 15 bảng, migrations tự động và nạp seed dữ liệu |
| **Thanh toán** | VNPay Gateway (Sandbox vpcpay v2) | Xử lý thanh toán thẻ ATM/nội địa, xác minh chữ ký bảo mật IPN |
| **Đóng gói & CI/CD** | Docker Compose, GitHub Actions, GHCR | Tự động hóa kiểm thử, đóng gói image và kích hoạt deploy |

---

## 2. Cấu trúc thư mục Monorepo

```text
brew-lite/
├── frontend/                   # Ứng dụng Next.js (chạy trong Docker hoặc Vercel)
│   ├── src/
│   │   ├── app/                # App Router: menu, cart, checkout, orders, auth, profile
│   │   ├── components/         # UI Components: Navbar, Toast, LoadingState, EmptyState...
│   │   ├── features/           # Logic tính năng: cart (cart-store, logic), products
│   │   ├── lib/                # Client gọi API: api-client, auth, money
│   │   └── types/              # Định nghĩa kiểu dữ liệu TypeScript
│   ├── Dockerfile              # Dockerfile chạy Next.js dev server trong container
│   └── package.json            # Dependencies và scripts frontend
├── backend/                    # Dịch vụ NestJS REST API (chạy trong Docker hoặc Render)
│   ├── src/
│   │   ├── main.ts             # Điểm khởi chạy NestJS, cấu hình CORS, ValidationPipe
│   │   ├── app.module.ts       # Root module kết nối toàn bộ module nghiệp vụ
│   │   ├── config/             # Cấu hình nạp biến môi trường tập trung (JWT, VNPay)
│   │   ├── prisma/             # PrismaService kết nối PostgreSQL
│   │   └── modules/            # Các module nghiệp vụ: auth, products, orders, payments, loyalty
│   ├── prisma/                 # Schema CSDL, migrations và file seed.ts
│   │   ├── schema.prisma       # Mô hình quan hệ 15 bảng
│   │   └── seed.ts             # Script nạp 151 món, topping, voucher và tài khoản demo
│   ├── prisma7.config.ts       # Cấu hình Prisma 7 (datasource url, migrations, seed)
│   ├── test/                   # Kiểm thử: unit, integration và e2e
│   ├── Dockerfile              # Production Dockerfile đa tầng
│   └── package.json            # Dependencies và scripts backend
├── docs/                       # Tài liệu thiết kế: kiến trúc, sơ đồ PlantUML, truy vết yêu cầu
│   ├── diagrams/               # Sơ đồ: activity, sequence, class, deployment, use case
│   └── traceability-matrix.md  # Ma trận truy vết yêu cầu phần mềm
├── .github/workflows/          # Tự động hóa CI/CD
│   ├── ci.yml                  # Pipeline kiểm thử tự động trên Pull Request
│   └── cd.yml                  # Pipeline build image, deploy và smoke test trên main/tag
├── docker-compose.yml          # Docker Compose trọn gói (PostgreSQL:5432, backend:3001, frontend:3000)
├── pnpm-workspace.yaml         # Cấu hình pnpm monorepo workspace
├── package.json                # Root package metadata (pnpm@12.8.1)
└── README.md                   # Tài liệu hướng dẫn onboarding hệ thống
```

---

## 3. Điều kiện tiên quyết

Người mới chỉ cần chuẩn bị một trong hai môi trường sau:

- **Nếu dùng Docker (Khuyên dùng):** Cài đặt **Git** và **Docker Desktop** (bật WSL 2 trên Windows). Không cần cài Node.js, pnpm hay PostgreSQL.
- **Nếu chạy trực tiếp (Không dùng Docker):** Cài đặt **Node.js 22+**, **pnpm 12.8+** (`corepack enable && corepack prepare pnpm@12.8.1 --activate`), và máy có sẵn PostgreSQL đang chạy hoặc kết nối Neon Cloud.

---

## 4. Hướng dẫn Khởi chạy Local (Local Setup & Run)

### Cách 1: Khởi chạy bằng Docker Compose (Khuyên dùng)

Cách này thiết lập nhanh nhất, an toàn nhất và độc lập 100% với hệ thống máy host:

#### Bước 1: Clone Repository
```bash
git clone https://github.com/dkhoaaaaa/brew-lite.git
cd brew-lite
```

#### Bước 2: Tạo file cấu hình môi trường `.env`
Sao chép file cấu hình mẫu `.env.example` thành `.env` tại thư mục gốc:
- **Windows (PowerShell):** `Copy-Item .env.example .env`
- **macOS / Linux:** `cp .env.example .env`

File `.env` mặc định đã có sẵn thông số chuẩn an toàn cho Docker local:
```env
POSTGRES_USER=brewlite
POSTGRES_PASSWORD=brewlite_secure_password_123
POSTGRES_DB=brewlite
LOCAL_DATABASE_URL="postgresql://brewlite:brewlite_secure_password_123@postgres:5432/brewlite?schema=public"
LOCAL_DIRECT_URL="postgresql://brewlite:brewlite_secure_password_123@postgres:5432/brewlite?schema=public"
JWT_ACCESS_SECRET=brewlite_dev_access_secret_key_2026
JWT_REFRESH_SECRET=brewlite_dev_refresh_secret_key_2026
NEXT_PUBLIC_API_URL=http://localhost:3001
FRONTEND_BASE_URL=http://localhost:3000
```

#### Bước 3: Build và khởi chạy các dịch vụ Docker
```bash
docker compose up -d --build
```
Kiểm tra trạng thái container: `docker compose ps`. Cả 3 container `postgres`, `backend`, `frontend` đều ở trạng thái `Up`.

#### Bước 4: Chạy Migration và Nạp dữ liệu mẫu (Seed Data)
```bash
# Áp dụng cấu trúc bảng CSDL
docker compose exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts migrate deploy

# Nạp dữ liệu sản phẩm, topping, voucher và tài khoản demo
docker compose exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts db seed
```

#### Bước 5: Truy cập ứng dụng Local
- **Frontend UI:** [http://localhost:3000](http://localhost:3000) (Trang chủ & Menu đồ uống)
- **Backend API Root:** [http://localhost:3001](http://localhost:3001)
- **Health Check API:** [http://localhost:3001/health](http://localhost:3001/health) (Trả về status: ok, database: connected)

---

### Cách 2: Khởi chạy trực tiếp bằng pnpm / Node.js (Không dùng Docker)

Dành cho nhà phát triển muốn chạy native trên máy host:

```bash
# 1. Clone và di chuyển vào thư mục dự án
git clone https://github.com/dkhoaaaaa/brew-lite.git
cd brew-lite

# 2. Cài đặt toàn bộ dependencies trong monorepo
pnpm install

# 3. Tạo file cấu hình .env (trỏ URL database về postgres của bạn)
cp .env.example .env

# 4. Sinh Prisma Client, chạy migration và nạp seed
pnpm --dir backend run prisma:generate
pnpm --dir backend exec prisma --config prisma7.config.ts migrate deploy
pnpm --dir backend exec prisma --config prisma7.config.ts db seed

# 5. Khởi chạy đồng thời cả Backend và Frontend
# Terminal 1 (Backend NestJS - port 3001):
pnpm --dir backend run start:dev

# Terminal 2 (Frontend Next.js - port 3000):
pnpm --dir frontend run dev
```

---

### Tùy chọn: Kết nối Neon PostgreSQL Cloud
Nếu muốn dùng database trên đám mây Neon thay vì chạy PostgreSQL local:
1. Đăng ký tài khoản miễn phí tại [Neon.tech](https://neon.tech) và tạo project.
2. Cập nhật `DATABASE_URL` (Pooled) và `DIRECT_URL` (Direct) vào file `.env`.
3. Chạy lệnh migrate và seed trực tiếp lên Neon:
   ```bash
   docker compose exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts migrate deploy
   docker compose exec -w /app/backend backend pnpm exec prisma --config prisma7.config.ts db seed
   ```

---

## 5. Hướng dẫn Kiểm thử tự động (Testing Guide)

Toàn bộ kiểm thử có thể thực thi thông qua Docker hoặc trực tiếp bằng pnpm:

### 5.1. Kiểm thử Backend (Vitest)

- **Chạy Unit Test & Integration Test:**
  - *Qua Docker:*
    ```bash
    docker compose exec -w /app/backend backend pnpm test
    ```
  - *Trực tiếp:*
    ```bash
    pnpm --dir backend run test
    ```
  *(Thực thi kiểm thử logic giỏ hàng, xác thực JWT, tính toán voucher, thanh toán VNPay và kiểm tra tồn kho nguyên liệu)*.

- **Chạy End-to-End (E2E) Test:**
  - *Qua Docker:*
    ```bash
    docker compose exec -w /app/backend backend pnpm test:e2e
    ```
  - *Trực tiếp:*
    ```bash
    pnpm --dir backend run test:e2e
    ```
  *(Kiểm thử tự động luồng hoàn chỉnh `checkout-flow.e2e-spec.ts`)*.

### 5.2. Kiểm tra quy chuẩn mã nguồn (Linting)

```bash
# Kiểm tra linter Backend (Oxlint)
pnpm --dir backend run lint
# hoặc qua Docker: docker compose exec -w /app/backend backend pnpm run lint

# Kiểm tra linter Frontend (ESLint)
pnpm --dir frontend run lint
# hoặc qua Docker: docker compose exec -w /app/frontend frontend pnpm run lint
```

---

## 6. Hướng dẫn Đóng gói & Build (Build Guide)

### 6.1. Build mã nguồn Frontend & Backend

- **Build Backend (NestJS):**
  ```bash
  pnpm --dir backend run build
  # hoặc: docker compose exec -w /app/backend backend pnpm run build
  ```
  *Kết quả build:* Tạo thư mục `backend/dist/` chứa mã JavaScript biên dịch sẵn sàng thực thi.

- **Build Frontend (Next.js):**
  ```bash
  pnpm --dir frontend run build
  # hoặc: docker compose exec -w /app/frontend frontend pnpm run build
  ```
  *Kết quả build:* Tạo thư mục `frontend/.next/` đã tối ưu hóa tài nguyên tĩnh (Static Generation) và SSR.

### 6.2. Đóng gói Docker Images

- **Build Backend Production Image bằng Dockerfile đa tầng:**
  ```bash
  docker build -f backend/Dockerfile -t brewlite-backend:latest .
  ```
- **Build toàn bộ hệ thống bằng Docker Compose:**
  ```bash
  docker compose build
  ```

---

## 7. Hướng dẫn Triển khai (Deployment Guide)

### 7.1. Cơ chế CI/CD tự động (GitHub Actions)

Dự án đã tích hợp sẵn quy trình triển khai liên tục qua workflow `.github/workflows/cd.yml`. Mỗi khi mã nguồn được push/merge vào nhánh `main` hoặc tạo Git Tag phiên bản (`v*`), hệ thống sẽ:
1. **Quality Gate:** Tự động cài đặt dependencies, chạy linter (`Oxlint`, `ESLint`), chạy Unit Test (`Vitest`) và kiểm tra build cả 2 tầng.
2. **Container Registry:** Đóng gói image Docker Backend và đẩy lên GitHub Container Registry (`ghcr.io/dkhoaaaaa/brew-lite/backend`).
3. **Trigger Deploy:** Kích hoạt Deploy Hook tới **Render** (Backend) và **Vercel** (Frontend).
4. **Smoke Test:** Tự động gửi request kiểm tra Health Check API (`/health`) và Frontend URL để đảm bảo phiên bản mới sẵn sàng 100%.

### 7.2. Hướng dẫn cấu hình triển khai thủ công lần đầu

#### A. Triển khai Frontend lên Vercel
1. Đăng nhập [Vercel](https://vercel.com) $\rightarrow$ **Add New Project** $\rightarrow$ Chọn repository `brew-lite`.
2. Thiết lập cấu hình:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `frontend`
   - **Build Command:** `pnpm run build`
   - **Output Directory:** `.next`
3. Cài đặt biến môi trường (Environment Variables):
   - `NEXT_PUBLIC_API_URL`: Điền URL Backend Render (ví dụ: `https://brew-lite-backend.onrender.com`)
4. Nhấn **Deploy**.

#### B. Triển khai Backend lên Render
1. Đăng nhập [Render](https://render.com) $\rightarrow$ **New Web Service** $\rightarrow$ Chọn repository `brew-lite`.
2. Thiết lập cấu hình:
   - **Environment:** `Docker` (hoặc `Node`)
   - **Dockerfile Path:** `backend/Dockerfile`
   - **Docker Context:** `.` (thư mục gốc)
3. Cài đặt biến môi trường:
   - `DATABASE_URL`: Chuỗi kết nối Pooled từ Neon PostgreSQL Cloud (`?sslmode=require`)
   - `DIRECT_URL`: Chuỗi kết nối Direct từ Neon PostgreSQL Cloud (`?sslmode=require`)
   - `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`: Khóa bí mật bảo mật cho JWT.
   - `FRONTEND_BASE_URL`: `https://brew-lite-tau.vercel.app`
   - `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_PAYMENT_URL`, `VNPAY_RETURN_URL`.
4. Nhấn **Create Web Service**.

---

## 8. Hướng dẫn Thu hồi & Hoàn tác (Rollback Guide)

Khi phiên bản triển khai mới gặp sự cố nghiêm trọng, thực hiện quy trình rollback theo từng tầng dưới đây để đưa hệ thống về trạng thái ổn định ngay lập tức:

### 8.1. Rollback Frontend (Vercel) — Dưới 1 phút
Vercel hỗ trợ Instant Rollback về bản build ổn định trước đó mà không cần biên dịch lại:
1. Truy cập [Vercel Dashboard](https://vercel.com/dashboard) $\rightarrow$ Chọn project **brew-lite**.
2. Chuyển sang tab **Deployments**.
3. Tìm bản deployment thành công gần nhất trước thời điểm xảy ra lỗi.
4. Bấm vào biểu tượng dấu ba chấm `...` ở góc phải deployment đó $\rightarrow$ Chọn **Instant Rollback** (hoặc **Promote to Production**).
5. Vercel sẽ chuyển hướng tên miền chính về bản build này ngay lập tức.

### 8.2. Rollback Backend (Render & Docker Registry)
1. Truy cập [Render Dashboard](https://dashboard.render.com) $\rightarrow$ Chọn Web Service Backend.
2. Vào mục **Events** hoặc **Deploys**.
3. Tìm bản deploy thành công gần nhất $\rightarrow$ Nhấn vào biểu tượng `...` và chọn **Rollback to this deploy**.
4. *(Nếu triển khai bằng Docker Container ghcr.io)*:
   Kéo tag commit SHA trước đó từ registry và khởi chạy lại:
   ```bash
   docker pull ghcr.io/dkhoaaaaa/brew-lite/backend:sha-<commit_sha_cũ>
   ```

### 8.3. Rollback Cơ sở dữ liệu (Database Migration Rollback)
Nếu bản migration mới làm lỗi schema database:
1. **Khôi phục dữ liệu tức thời trên Neon Cloud:** Sử dụng tính năng **Point-in-Time Restore (PITR)** trên bảng điều khiển Neon để đưa CSDL về thời điểm trước khi áp dụng migration bị lỗi.
2. **Khôi phục bằng mã nguồn:**
   - Tạo file migration hoàn tác schema về trạng thái trước:
     ```bash
     pnpm --dir backend exec prisma migrate dev --name rollback_last_change
     ```
   - Áp dụng migration hoàn tác lên server:
     ```bash
     pnpm --dir backend exec prisma --config prisma7.config.ts migrate deploy
     ```

### 8.4. Rollback Mã nguồn trên Git
Để đảo ngược commit gây lỗi trên nhánh `main` mà vẫn bảo toàn toàn bộ lịch sử commit:
```bash
# 1. Tạo commit đảo ngược thay đổi của commit lỗi
git revert <commit-hash-lỗi>

# 2. Đẩy commit revert lên nhánh main (kích hoạt lại CI/CD deploy bản sửa lỗi)
git push origin main
```

---

## 9. Tài khoản Demo & Kịch bản kiểm thử nghiệp vụ E2E

### 9.1. Danh sách tài khoản thử nghiệm (Được tạo tự động từ Seed)

| Vai trò | Email đăng nhập | Mật khẩu | Điểm tích lũy | Mục đích kiểm thử |
|---|---|---|---|---|
| **Khách hàng tiêu chuẩn** | `example@gmail.com` | `Example@123` | 0 điểm | Kiểm tra luồng đặt món, giỏ hàng, áp dụng voucher tân thủ |
| **Khách hàng thân thiết** | `customer1@gmail.com` | `Customer@123` | 200 điểm | Kiểm tra tính năng tích lũy và đổi voucher bằng điểm thưởng |

### 9.2. Kịch bản kiểm thử luồng nghiệp vụ từ đầu đến cuối (E2E Flow)

1. **Khám phá thực đơn (`/menu`):**
   - Truy cập trang Menu trên production hoặc local.
   - Lọc sản phẩm theo danh mục: *Cà phê*, *Trà*, *Bánh* hoặc tìm kiếm theo tên món.
2. **Tùy chỉnh món (`/products/[id]`):**
   - Chọn một sản phẩm (ví dụ: *Cà phê Sữa Đá*).
   - Chọn kích thước (Size S, M hoặc L), thêm các loại Topping, điều chỉnh mức đá/đường $\rightarrow$ Nhấn **Thêm vào giỏ hàng**.
3. **Quản lý giỏ hàng (`/cart`):**
   - Bấm vào biểu tượng Giỏ hàng, thay đổi số lượng món, kiểm tra tính toán tổng tiền.
   - Bấm **Tiến hành đặt hàng**.
4. **Đăng nhập xác thực (`/login`):**
   - Điền thông tin tài khoản mẫu: `example@gmail.com` / `Example@123`.
5. **Thanh toán & Áp dụng voucher (`/checkout`):**
   - Nhập thông tin giao hàng, áp dụng mã giảm giá có sẵn (ví dụ: `BREWLITE10`, `WELCOME15`, `COFFEE5K`).
   - Chọn phương thức thanh toán: **VNPay Sandbox** $\rightarrow$ Bấm **Xác nhận đặt hàng**.
6. **Xác nhận & Theo dõi đơn hàng (`/orders`):**
   - Kiểm tra đơn hàng được ghi nhận, trạng thái đơn và chi tiết lịch sử mua hàng.

### 9.3. Video Demo trực tiếp luồng End-to-End

- **Đường dẫn xem video:** [Nhấp vào đây để xem Video Demo (Google Drive)](https://drive.google.com/file/d/1iHT4lmRY7KDPE1H1Fg6_ofTUbZI9RrEb/view?usp=sharing)
- **Nội dung bao gồm trong video demo:**
  1. **Khám phá thực đơn:** Lọc danh mục món Cà phê / Trà / Bánh.
  2. **Tùy chỉnh món (Product Customization):** Chọn size S/M/L, chọn topping và điều chỉnh tỷ lệ đá/đường.
  3. **Quản lý giỏ hàng:** Cập nhật số lượng món và xem tổng tiền tự động.
  4. **Đăng nhập & Đặt hàng:** Sử dụng tài khoản demo và áp dụng mã giảm giá voucher.
  5. **Thanh toán trực tuyến:** Chuyển hướng sang cổng thanh toán VNPay Sandbox, thực hiện thanh toán bằng thẻ ATM nội địa NCB.
  6. **Kiểm tra kết quả:** Nhận thông báo giao dịch thành công, kiểm tra đơn hàng tại trang Lịch sử đơn hàng và cập nhật tồn kho nguyên liệu.

---

## 10. Tích hợp cổng thanh toán VNPay Sandbox

### 10.1. Thông tin thẻ ngân hàng thử nghiệm (NCB Sandbox)

Khi chuyển hướng sang cổng thanh toán VNPay, chọn ngân hàng **NCB** và sử dụng thông tin thẻ:

| Thông tin | Giá trị nhập |
|---|---|
| **Ngân hàng phát hành** | NCB (Ngân hàng Quốc Dân) |
| **Số thẻ** | `9704198526191432198` |
| **Tên chủ thẻ** | `NGUYEN VAN A` |
| **Ngày phát hành** | `07/15` |
| **Mã xác thực OTP** | `123456` |

### 10.2. Kiểm thử khi chưa có cấu hình VNPay
Hệ thống vẫn cho phép tạo đơn hàng thành công trong database (`POST /orders`), lưu trạng thái `PENDING` và kích hoạt logic khóa tồn kho nguyên liệu. Chỉ khi nhấn nút chuyển sang cổng thanh toán VNPay mà chưa điền Secret Key thì hệ thống mới báo `503 Service Unavailable`.

---

## 11. Quản trị Docker & Khắc phục sự cố (Troubleshooting)

### 11.1. Các lệnh quản lý Docker thường dùng

| Thao tác | Lệnh thực thi |
|---|---|
| **Xem logs thời gian thực toàn bộ hệ thống** | `docker compose logs -f` |
| **Xem logs riêng Backend** | `docker compose logs -f backend` |
| **Xem logs riêng Frontend** | `docker compose logs -f frontend` |
| **Khởi động lại các container** | `docker compose restart` |
| **Dừng các container** | `docker compose stop` |
| **Dừng và gỡ bỏ container, giữ nguyên volume** | `docker compose down` |
| **Đặt lại CSDL hoàn toàn (Reset DB)** | `docker compose down -v && docker compose up -d --build` |

### 11.2. Xử lý sự cố thường gặp
- **Xung đột cổng (Port 3000, 3001 hoặc 5432):** Dùng lệnh `netstat -ano | findstr :<port>` (Windows) để tìm và dừng ứng dụng đang chiếm port, hoặc sửa port mapping trong `docker-compose.yml`.
- **Lỗi chưa migrate mà đã seed:** Luôn chạy `migrate deploy` thành công trước khi chạy `db seed`.
- **Lỗi CORS:** Đảm bảo biến `FRONTEND_BASE_URL` trong file `.env` của backend chứa đúng origin gọi tới.
